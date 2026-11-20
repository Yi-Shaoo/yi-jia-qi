import { api, ApiError, setApiAccount } from "./api";
import { toast } from "svelte-sonner";
import { writeLocal } from "./local";
import { startSync, stopSync } from "./sync.svelte";
import type { Who } from "./types";

export const session = $state({ who: null as Who | null, checked: false, verifying: false, unavailable: false });

export function me(): Who {
	if (!session.who) throw new Error("not signed in");
	return session.who;
}

function changeAccount(who: Who | null) {
	if (session.who === who) return;
	stopSync();
	setApiAccount(who);
	toast.dismiss();
	session.who = who;
	if (who) startSync();
}

let revision = 0;
async function verify(reset: boolean) {
	const check = ++revision;
	session.verifying = true;
	if (reset) {
		session.checked = false;
		changeAccount(null);
	}
	try {
		const { who } = await api<{ who: Who }>("/me");
		if (check !== revision) return;
		changeAccount(who);
		session.unavailable = false;
	} catch (error) {
		if (check !== revision) return;
		changeAccount(null);
		session.unavailable = !(error instanceof ApiError && error.status === 401);
	} finally {
		if (check === revision) {
			session.checked = true;
			session.verifying = false;
		}
	}
}

export const checkSession = () => verify(true);

const signalKey = "yjq:session-changed";
let channel: BroadcastChannel | undefined;
function announceChange() {
	if (channel) channel.postMessage(null);
	else writeLocal(signalKey, crypto.getRandomValues(new Uint32Array(2)).join("-"));
}

export async function login(password: string) {
	await api("/login", { method: "POST", body: JSON.stringify({ password }) });
	announceChange();
	await checkSession();
}

export async function logout() {
	try {
		await api("/logout", { method: "POST", headers: { "x-yjq-account": me() } });
	} catch (error) {
		if (error instanceof ApiError && error.status === 412) return checkSession();
		if (!(error instanceof ApiError && error.status === 401)) {
			toast.error("未能退出登录，请检查网络后重试");
			return;
		}
	}
	announceChange();
	await checkSession();
}

if (typeof window !== "undefined") {
	try {
		channel = new BroadcastChannel(signalKey);
		channel.onmessage = checkSession;
	} catch {}
	window.addEventListener("storage", (e) => { if (e.key === signalKey || e.key === null) void checkSession(); });
	window.addEventListener(signalKey, checkSession);
	const revalidate = () => { if (session.checked && !document.hidden) void verify(false); };
	window.addEventListener("focus", revalidate);
	window.addEventListener("pageshow", (e) => { if (e.persisted) void checkSession(); });
	document.addEventListener("visibilitychange", revalidate);
}
