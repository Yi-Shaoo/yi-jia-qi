import { existsSync, statSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { config } from "./config";
import {
	allowLoginAttempt,
	clearCookie,
	readSession,
	sessionCookie,
	whoForPassword,
	type Who,
} from "./auth";
import {
	deleteDoc,
	fileInfo,
	forgetFile,
	getDoc,
	isCollection,
	listDocs,
	mergeDoc,
	newId,
	putDoc,
	recordFile,
	type DocData,
} from "./db";
import { broadcast, subscribe } from "./events";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const FILE_RE = /^[0-9a-f]{32}$/;
const MAX_DOC_BYTES = 256 * 1024;

const json = (body: unknown, init: ResponseInit = {}) =>
	Response.json(body, { ...init, headers: { "cache-control": "no-store", ...init.headers } });
const fail = (status: number, error: string) => json({ error }, { status });

function isHttps(req: Request) {
	return req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
}

function clientIp(req: Request, server: Bun.Server<undefined>) {
	return (
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		server.requestIP(req)?.address ||
		"unknown"
	);
}

async function readBody(req: Request): Promise<DocData | null> {
	const text = await req.text();
	if (text.length > MAX_DOC_BYTES) return null;
	try {
		const v = JSON.parse(text);
		return v && typeof v === "object" && !Array.isArray(v) ? (v as DocData) : null;
	} catch {
		return null;
	}
}

function sniffImage(buf: Uint8Array): string | null {
	const b = (i: number) => buf[i];
	if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
	if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
	if (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46) return "image/gif";
	if (
		b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
		b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50
	)
		return "image/webp";
	return null;
}

function randomHex(n = 16) {
	return Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => x.toString(16).padStart(2, "0")).join("");
}

async function api(req: Request, url: URL, server: Bun.Server<undefined>): Promise<Response> {
	const path = url.pathname.replace(/^\/api/, "") || "/";
	const method = req.method;

	if (path === "/health") return json({ ok: true });

	if (path === "/login" && method === "POST") {
		if (!allowLoginAttempt(clientIp(req, server))) return fail(429, "试太多次了，过十分钟再来");
		const body = await readBody(req);
		const who = typeof body?.password === "string" ? whoForPassword(body.password) : null;
		if (!who) return fail(401, "密码不对");
		return json({ who }, { headers: { "set-cookie": await sessionCookie(who, isHttps(req)) } });
	}
	if (path === "/logout" && method === "POST") {
		return json({ ok: true }, { headers: { "set-cookie": clearCookie() } });
	}

	const who = await readSession(req);
	if (!who) return fail(401, "请先登录");

	if (path === "/me") return json({ who });

	if (path === "/events" && method === "GET") return subscribe(req);

	// 照片上传：POST 生成新 id；PUT /files/:id 用指定 id（导入旧数据时保持原来的照片 id，已存在则 409）
	const fileId = path.match(/^\/files\/([0-9a-f]{32})$/)?.[1];
	if ((path === "/files" && method === "POST") || (fileId && method === "PUT")) {
		if (fileId && fileInfo(fileId)) return fail(409, "这张照片已经有了");
		const form = await req.formData().catch(() => null);
		const file = form?.get("file");
		if (!(file instanceof File)) return fail(400, "没有收到照片");
		if (file.size > config.maxUploadBytes) return fail(413, "照片太大了");
		const buf = new Uint8Array(await file.arrayBuffer());
		const type = sniffImage(buf);
		if (!type) return fail(415, "只支持 JPG / PNG / WebP / GIF");
		const id = fileId ?? randomHex();
		await Bun.write(join(config.filesDir, id), buf);
		recordFile(id, type, buf.byteLength, who);
		return json({ id, url: `/files/${id}` });
	}
	if (fileId && method === "DELETE") {
		const id = fileId;
		await unlink(join(config.filesDir, id)).catch(() => {});
		forgetFile(id);
		return json({ ok: true });
	}

	// 文档：/c/:collection 和 /c/:collection/:id
	const m = path.match(/^\/c\/([a-z]+)(?:\/([^/]+))?$/);
	if (m) {
		const [, col, id] = m;
		if (!isCollection(col)) return fail(404, "没有这个集合");
		if (id !== undefined && !ID_RE.test(id)) return fail(400, "id 不合法");

		if (!id && method === "GET") return json({ docs: listDocs(col) });
		if (!id && method === "POST") {
			const data = await readBody(req);
			if (!data) return fail(400, "内容不合法");
			const doc = putDoc(col, newId(), data);
			broadcast({ col, op: "put", doc, by: who });
			return json(doc);
		}
		if (id && method === "GET") {
			const doc = getDoc(col, id);
			return doc ? json(doc) : fail(404, "没找到");
		}
		if (id && method === "PUT") {
			const data = await readBody(req);
			if (!data) return fail(400, "内容不合法");
			const doc = putDoc(col, id, data);
			broadcast({ col, op: "put", doc, by: who });
			return json(doc);
		}
		if (id && method === "PATCH") {
			const data = await readBody(req);
			if (!data) return fail(400, "内容不合法");
			const doc = mergeDoc(col, id, data);
			if (!doc) return fail(404, "没找到");
			broadcast({ col, op: "put", doc, by: who });
			return json(doc);
		}
		if (id && method === "DELETE") {
			deleteDoc(col, id);
			broadcast({ col, op: "delete", id, by: who });
			return json({ ok: true });
		}
	}

	return fail(404, "没有这个接口");
}

async function serveFile(req: Request, id: string): Promise<Response> {
	if (!(await readSession(req))) return new Response("请先登录", { status: 401 });
	if (!FILE_RE.test(id)) return new Response("Not found", { status: 404 });
	const info = fileInfo(id);
	const f = Bun.file(join(config.filesDir, id));
	if (!info || !(await f.exists())) return new Response("Not found", { status: 404 });
	return new Response(f, {
		headers: { "content-type": info.type, "cache-control": "private, max-age=31536000, immutable" },
	});
}

function serveStatic(url: URL): Response {
	const rel = decodeURIComponent(url.pathname);
	const full = normalize(join(config.staticDir, rel));
	if (full.startsWith(config.staticDir + sep) && existsSync(full) && statSync(full).isFile()) {
		const immutable = rel.startsWith("/assets/");
		return new Response(Bun.file(full), {
			headers: { "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache" },
		});
	}
	// 单页应用：其它路径都返回 index.html
	const index = join(config.staticDir, "index.html");
	if (existsSync(index)) return new Response(Bun.file(index), { headers: { "cache-control": "no-cache" } });
	return new Response("前端还没有构建，先运行 bun run build", { status: 503 });
}

const server = Bun.serve({
	port: config.port,
	// SSE 长连接需要更长的空闲时间
	idleTimeout: 255,
	async fetch(req, server) {
		const url = new URL(req.url);
		try {
			if (url.pathname.startsWith("/api/")) return await api(req, url, server);
			const fm = url.pathname.match(/^\/files\/([^/]+)$/);
			if (fm) return await serveFile(req, fm[1]);
			return serveStatic(url);
		} catch (err) {
			console.error(err);
			return fail(500, "服务器出错了");
		}
	},
});

console.log(`Yi & Jia Qi 服务已启动：http://localhost:${server.port}  数据目录：${config.dataDir}`);

export type { Who };
