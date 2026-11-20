import { test as base, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { CollectionName, Collections, Doc } from "../../src/lib/types";

interface Site { url: string; password: string; partner: string }
interface App {
	put<K extends CollectionName>(col: K, id: string, data: Collections[K]): Promise<void>;
	docs<K extends CollectionName>(col: K): Promise<Doc<Collections[K]>[]>;
	photo(): Promise<string>;
}
export const png = {
	name: "海边.png", mimeType: "image/png",
	buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXkAAAAASUVORK5CYII=", "base64"),
};

export const test = base.extend<{ site: Site; app: App }>({
	site: async ({}, use) => {
		const dataDir = await mkdtemp(join(tmpdir(), "yjq-browser-"));
		const password = randomUUID(), partner = randomUUID();
		const child = spawn("bun", ["server/index.ts"], { env: {
			...process.env, DATA_DIR: dataDir, STATIC_DIR: join(process.cwd(), "dist"), PORT: "0", BIND_ADDRESS: "127.0.0.1",
			NODE_ENV: "production", YI_PASSWORD: password, JQ_PASSWORD: partner, SESSION_SECRET: randomUUID(),
		}, stdio: ["ignore", "pipe", "inherit"] });
		const stopped = once(child, "close");
		const lines = createInterface({ input: child.stdout });
		try {
			let port: string | undefined;
			for await (const line of lines) {
				port = /http:\/\/localhost:(\d+)/.exec(line)?.[1];
				if (port) break;
			}
			if (!port) throw new Error("隔离测试服务未启动");
			await use({ url: `http://127.0.0.1:${port}`, password, partner });
		} finally {
			lines.close();
			child.kill();
			await stopped;
			await rm(dataDir, { recursive: true, force: true });
		}
	},
	baseURL: async ({ site }, use) => use(site.url),
	app: async ({ page, site }, use) => {
		const request = page.request;
		await expect(await request.post("/api/login", { data: { password: site.password } })).toBeOK();
		await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.abort());
		await use({
			put: async (col, id, data) => { await expect(await request.put(`/api/c/${col}/${id}`, { data })).toBeOK(); },
			docs: async (col) => {
				const result = await request.get(`/api/c/${col}`);
				await expect(result).toBeOK();
				return (await result.json()).docs;
			},
			photo: async () => {
				const response = await request.post("/api/files", { multipart: { file: png } });
				await expect(response).toBeOK();
				return (await response.json()).id;
			},
		});
	},
});
export { expect };
