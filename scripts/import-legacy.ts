/**
 * 把旧版网站（claude.ai Artifact）的数据导入新网站。
 *
 * 数据来源（都放在本地，不提交到 git）：
 *   --html    旧版网站的单文件快照（里面内嵌了照片），默认 "Yi & Jia Qi.html"
 *   --export  从旧网站数据库导出的 JSON（每个集合一个文件夹、每条一个 <id>.json），默认 legacy/export
 *   --assets  快照之后才上传的照片（<id>.jpg），默认 legacy/assets
 *
 * 导入目标是正在运行的新网站，走它自己的 API，所以本地和 Coolify 上都能用：
 *   bun scripts/import-legacy.ts --to http://localhost:3000 --password <Yi 的密码>
 *   bun scripts/import-legacy.ts --to https://你的域名 --password <Yi 的密码>
 *
 * 已经存在的数据默认跳过，可以放心重复运行；加 --force 会用旧数据覆盖。
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
	options: {
		to: { type: "string", default: "http://localhost:3000" },
		password: { type: "string" },
		html: { type: "string", default: "Yi & Jia Qi.html" },
		export: { type: "string", default: "legacy/export" },
		assets: { type: "string", default: "legacy/assets" },
		force: { type: "boolean", default: false },
	},
});

if (!args.password) {
	console.error("用法：bun scripts/import-legacy.ts --to <网站地址> --password <密码>");
	process.exit(1);
}

const base = args.to!.replace(/\/+$/, "");
const COLLECTIONS = [
	"wishes", "meta", "spots", "custom", "photos", "memories", "diary", "about",
	"aboutcats", "daily", "stamps", "miss", "bottles", "letters", "pet",
];

// —— 登录 ——
const login = await fetch(`${base}/api/login`, {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({ password: args.password }),
});
if (!login.ok) {
	console.error("登录失败：", ((await login.json().catch(() => ({}))) as { error?: string }).error ?? login.status);
	process.exit(1);
}
const cookie = login.headers.get("set-cookie")!.split(";")[0];
const H = { cookie };
console.log(`已登录 ${base}`);

// —— 读旧数据 ——
const docs = new Map<string, Map<string, Record<string, unknown>>>();
function addDoc(col: string, id: string, data: Record<string, unknown>) {
	if (!docs.has(col)) docs.set(col, new Map());
	docs.get(col)!.set(id, data);
}
if (existsSync(args.export!)) {
	for (const col of COLLECTIONS) {
		const dir = join(args.export!, col);
		if (!existsSync(dir)) continue;
		for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
			addDoc(col, basename(f, ".json"), JSON.parse(readFileSync(join(dir, f), "utf8")));
		}
	}
} else console.warn(`没找到 ${args.export}，跳过数据库导出`);

const files = new Map<string, Uint8Array>();
function hexId(name: string) {
	return createHash("sha256").update(`legacy:${name}`).digest("hex").slice(0, 32);
}
function grabJsVar(html: string, name: string): unknown {
	const line = html.split("\n").find((l) => l.startsWith(`var ${name}=`));
	if (!line) return null;
	// 只取紧跟在 = 后面的那段 JSON（同一行后面可能还有别的代码）
	const src = line.slice(`var ${name}=`.length);
	let depth = 0;
	let inStr = false;
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (inStr) {
			if (ch === "\\") i++;
			else if (ch === '"') inStr = false;
		} else if (ch === '"') inStr = true;
		else if (ch === "{" || ch === "[") depth++;
		else if (ch === "}" || ch === "]") {
			if (--depth === 0) return JSON.parse(src.slice(0, i + 1));
		}
	}
	return null;
}

if (existsSync(args.html!)) {
	const html = readFileSync(args.html!, "utf8");
	const asset = (grabJsVar(html, "ASSET") ?? {}) as Record<string, string>;
	for (const [id, b64] of Object.entries(asset)) files.set(id, Buffer.from(b64, "base64"));
	// 快照里内置的照片：封面 + 相册里的几张
	const ph = (grabJsVar(html, "PH") ?? {}) as Record<string, string>;
	const seed = (grabJsVar(html, "SEED") ?? []) as [string, string, string, string][];
	if (ph.HERO) {
		const id = hexId("HERO");
		files.set(id, Buffer.from(ph.HERO, "base64"));
		const meta = docs.get("meta")?.get("shared") ?? {};
		if (!meta.hero) addDoc("meta", "shared", { ...meta, hero: id });
	}
	seed.forEach(([key, cap, tag, st], i) => {
		if (!ph[key]) return;
		const id = hexId(key);
		files.set(id, Buffer.from(ph[key], "base64"));
		addDoc("photos", `seed-${key.toLowerCase()}`, { asset: id, cap, tag, st, c: 1794900000000 - i * 1000 });
	});
	console.log(`快照：${Object.keys(asset).length} 张照片，${seed.length} 张相册内置照片`);
} else console.warn(`没找到 ${args.html}，跳过快照里的照片`);

if (existsSync(args.assets!)) {
	for (const f of readdirSync(args.assets!)) {
		const id = f.match(/^([0-9a-f]{32})/)?.[1];
		if (id) files.set(id, readFileSync(join(args.assets!, f)));
	}
}

// 已经分好类的旧相册照片，给个分类方便筛选
for (const [, p] of docs.get("photos") ?? []) if (p.tag === undefined) p.tag = "";

// —— 上传照片 ——
let fUp = 0;
let fSkip = 0;
for (const [id, buf] of files) {
	const fd = new FormData();
	fd.append("file", new Blob([buf]), `${id}.jpg`);
	const r = await fetch(`${base}/api/files/${id}`, { method: "PUT", headers: H, body: fd });
	if (r.status === 409) fSkip++;
	else if (r.ok) fUp++;
	else console.warn(`照片 ${id} 上传失败：`, ((await r.json().catch(() => ({}))) as { error?: string }).error ?? r.status);
}
console.log(`照片：新上传 ${fUp} 张，已存在 ${fSkip} 张`);

// —— 写入数据 ——
for (const [col, m] of docs) {
	let put = 0;
	let skip = 0;
	const existing = new Set(
		((await (await fetch(`${base}/api/c/${col}`, { headers: H })).json()) as { docs: { id: string }[] }).docs.map((d) => d.id),
	);
	for (const [id, data] of m) {
		if (existing.has(id) && !args.force) {
			skip++;
			continue;
		}
		const r = await fetch(`${base}/api/c/${col}/${encodeURIComponent(id)}`, {
			method: "PUT",
			headers: { ...H, "content-type": "application/json" },
			body: JSON.stringify(data),
		});
		if (r.ok) put++;
		else console.warn(`${col}/${id} 写入失败：`, r.status);
	}
	console.log(`${col}: 写入 ${put} 条${skip ? `，跳过已存在 ${skip} 条` : ""}`);
}
console.log("导入完成 ✓");
