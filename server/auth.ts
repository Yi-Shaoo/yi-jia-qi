import { config } from "./config";

export type Who = "yi" | "jq";
const COOKIE = "yjq_session";

const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;
function key() {
	keyPromise ??= crypto.subtle.importKey(
		"raw",
		enc.encode(config.sessionSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
	return keyPromise;
}

function b64url(buf: ArrayBuffer) {
	return Buffer.from(buf).toString("base64url");
}

async function sign(payload: string) {
	return b64url(await crypto.subtle.sign("HMAC", await key(), enc.encode(payload)));
}

function safeEqual(a: string, b: string) {
	const x = enc.encode(a);
	const y = enc.encode(b);
	if (x.length !== y.length) return false;
	let diff = 0;
	for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
	return diff === 0;
}

export function whoForPassword(password: string): Who | null {
	if (safeEqual(password, config.passwords.yi)) return "yi";
	if (safeEqual(password, config.passwords.jq)) return "jq";
	return null;
}

export async function sessionCookie(who: Who, secure: boolean) {
	const exp = Date.now() + config.sessionDays * 864e5;
	const payload = `${who}.${exp}`;
	const value = `${payload}.${await sign(payload)}`;
	return [
		`${COOKIE}=${value}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		`Max-Age=${config.sessionDays * 86400}`,
		secure ? "Secure" : "",
	]
		.filter(Boolean)
		.join("; ");
}

export function clearCookie() {
	return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function readSession(req: Request): Promise<Who | null> {
	const raw = req.headers.get("cookie") ?? "";
	const m = raw.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
	if (!m) return null;
	const [who, exp, sig] = m.slice(COOKIE.length + 1).split(".");
	if ((who !== "yi" && who !== "jq") || !exp || !sig) return null;
	if (Number(exp) < Date.now()) return null;
	const expect = await sign(`${who}.${exp}`);
	return safeEqual(sig, expect) ? who : null;
}

const failures = new Map<string, { count: number; until: number }>();

export function loginCooldown(ip: string, now = Date.now()) {
	const entry = failures.get(ip);
	if (!entry) return 0;
	if (entry.until <= now) { failures.delete(ip); return 0; }
	return entry.count < 10 ? 0 : Math.ceil((entry.until - now) / 1000);
}

export function recordLoginFailure(ip: string, now = Date.now()) {
	const entry = failures.get(ip);
	if (entry && entry.until > now) entry.count++;
	else failures.set(ip, { count: 1, until: now + 600_000 });
}
