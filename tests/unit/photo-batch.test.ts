import { describe, expect, test } from "bun:test";
import { ApiError } from "../../src/lib/api";
import { createMemoryDraft, saveMemoryDraft } from "../../src/lib/memory-draft";
import { uploadBatch, type SelectedPhoto } from "../../src/lib/photo-batch";
import type { Doc, Memory } from "../../src/lib/types";
import { photoErrorMessage, photoFailure } from "../../src/lib/upload";

const file = (name: string) => new File([name], name, { type: "image/png" });
const selection = (name: string) => ({ file: file(name), preview: `blob:test/${name}` });
const record = (id: string, data: Memory): Doc<Memory> => ({ id, data, updated: Date.now() });
const noop = () => {};

describe("上传错误", () => {
	test("解码、大小、网络和服务端错误各自给出恢复动作", () => {
		for (const e of [new Error("decode"), new Error("encode"), new ApiError(413, ""), new ApiError(415, "")]) {
			expect(photoFailure(e).retryable).toBe(false);
		}
		for (const e of [new TypeError("offline"), new Error("upload-receipt"), new ApiError(429, ""), new ApiError(503, "")]) {
			expect(photoFailure(e).retryable).toBe(true);
		}
		expect(photoErrorMessage(new Error("decode"))).toContain("JPG");
		expect(photoErrorMessage(new ApiError(413, "limit"))).toContain("太大");
		expect(photoErrorMessage(new TypeError("Failed to fetch"))).toContain("网络");
		expect(photoErrorMessage(new ApiError(503, "unavailable"))).toContain("服务器");
		for (const e of [new ApiError(413, ""), new ApiError(415, ""), new TypeError(), new Error("encode"), null]) {
			expect(photoErrorMessage(e)).not.toMatch(/HEIC|JPG/i);
		}
	});
});

test("相册重试保留失败文件和原分类；服务器已接收的图片只重试写入记录", async () => {
	const batch = ["ok", "large", "offline", "save"].map((name) => ({ file: file(name), tag: "sea" })) as (SelectedPhoto & { tag: string })[];
	const uploads: string[] = [], writes: string[] = [];
	let first = true;
	const options = {
		upload: async (f: File) => {
			uploads.push(f.name);
			if (first && f.name === "large") throw new ApiError(413, "");
			if (first && f.name === "offline") throw new TypeError();
			return `asset-${f.name}`;
		},
		addToAlbum: async (item: typeof batch[number], asset: string) => {
			writes.push(`${item.tag}:${asset}`);
			if (first && item.file.name === "save") throw new TypeError();
		},
	};
	await uploadBatch(batch, options);
	const failed = batch.filter((p) => p.error);
	expect(failed.map((p) => p.file.name)).toEqual(["large", "offline", "save"]);
	expect(failed[0].error).toMatchObject({ message: expect.stringContaining("太大"), retryable: false });
	expect(failed[2].asset).toBe("asset-save");
	expect(failed[2].error).toMatchObject({ message: expect.stringContaining("已上传"), retryable: true });
	first = false;
	await uploadBatch(failed, options);
	expect(failed.filter((p) => p.error).map((p) => p.file.name)).toEqual(["large"]);
	expect(uploads).toEqual(["ok", "large", "offline", "save", "offline"]);
	expect(writes).toEqual(["sea:asset-ok", "sea:asset-save", "sea:asset-offline", "sea:asset-save"]);
});

describe("回忆批处理", () => {
	test("部分成功先保存到同一段回忆；连续重试不改写未变化的记录，也不重传成功项", async () => {
		const draft = createMemoryDraft(null);
		draft.title = "海边";
		draft.photos = [selection("first"), selection("second")];
		const uploads: string[] = [], writes: string[] = [];
		let unavailable = true;
		const upload = async (f: File) => {
			uploads.push(f.name);
			if (unavailable && f.name === "first") throw new TypeError("network");
			return f.name;
		};
		const memory = {
			set: async (id: string, data: Memory) => { writes.push(`new:${id}`); return record(id, data); },
			update: async (id: string, patch: Partial<Memory>) => { writes.push(`edit:${id}`); return record(id, { ...draft.saved!, ...patch }); },
		};
		expect(await saveMemoryDraft(draft, memory, noop, { upload })).toBe(1);
		expect(draft.saved?.photos).toEqual(["second"]);
		expect(draft.photos[0]).toMatchObject({ file: { name: "first" }, error: { message: expect.stringContaining("网络"), retryable: true } });
		expect(await saveMemoryDraft(draft, memory, noop, { upload })).toBe(1);
		expect(writes).toEqual([`new:${draft.id}`]);
		unavailable = false;
		expect(await saveMemoryDraft(draft, memory, noop, { upload })).toBe(0);
		expect(writes).toEqual([`new:${draft.id}`, `edit:${draft.id}`]);
		expect(uploads).toEqual(["first", "second", "first", "first"]);
		expect(draft.saved?.photos).toEqual(["first", "second"]);
	});

	test("新增回忆在提交成功但响应丢失后，重试沿用同一记录和已上传的图片", async () => {
		const draft = createMemoryDraft(null);
		draft.photos.push(selection("one"));
		const server = new Map<string, Memory>();
		let uploads = 0, attempts = 0;
		const upload = async () => { uploads++; return "asset"; };
		const memory = {
			set: async (id: string, data: Memory) => {
				server.set(id, data);
				if (++attempts === 1) throw new TypeError("offline");
				return record(id, data);
			},
			update: async () => { throw new Error("unexpected update"); },
		};
		await expect(saveMemoryDraft(draft, memory, noop, { upload })).rejects.toThrow("offline");
		expect(draft.photos[0].asset).toBe("asset");
		expect(await saveMemoryDraft(draft, memory, noop, { upload })).toBe(0);
		expect(server.size).toBe(1);
		expect(server.get(draft.id)?.photos).toEqual(["asset"]);
		expect(uploads).toBe(1);
	});

	test("响应丢失后撤回新增图，再保存也会同步和清理，不误报已保存", async () => {
		const saved = record("memory", { c: 1, date: "2026-01-01", title: "标题", text: "正文", photos: ["keep"] });
		const draft = createMemoryDraft(saved);
		draft.photos.push(selection("extra"));
		let server = saved.data, writes = 0;
		const deleted: string[] = [];
		const options = { upload: async () => "extra", remove: async (id: string) => { deleted.push(id); } };
		const memory = {
			set: async () => { throw new Error("unexpected insert"); },
			update: async (id: string, patch: Partial<Memory>) => {
				server = { ...server, ...patch };
				if (++writes === 1) throw new TypeError("offline");
				return record(id, server);
			},
		};
		await expect(saveMemoryDraft(draft, memory, noop, options)).rejects.toThrow("offline");
		expect(server.photos).toEqual(["keep", "extra"]);
		draft.photos.pop();
		await saveMemoryDraft(draft, memory, noop, options);
		expect(server.photos).toEqual(["keep"]);
		expect(deleted).toEqual(["extra"]);
	});

	test("编辑失败不删除原图；保存后才清理已移除的原图", async () => {
		const saved = record("memory", { c: 1, date: "2026-01-01", title: "标题", text: "正文", photos: ["keep", "old"], dlabel: "元旦" });
		const draft = createMemoryDraft(saved);
		draft.photos.splice(1, 1, selection("new"));
		expect(draft.saved?.photos).toEqual(["keep", "old"]);
		const deleted: string[] = [];
		let first = true, uploads = 0;
		const options = { upload: async () => { uploads++; return "new"; }, remove: async (id: string) => { deleted.push(id); } };
		const memory = {
			set: async () => { throw new Error("unexpected insert"); },
			update: async (id: string, patch: Partial<Memory>) => {
				if (first) throw new TypeError("offline");
				return record(id, { ...saved.data, ...patch });
			},
		};
		await expect(saveMemoryDraft(draft, memory, noop, options)).rejects.toThrow("offline");
		expect(deleted).toEqual([]);
		expect(draft.saved?.photos).toEqual(["keep", "old"]);
		first = false;
		await saveMemoryDraft(draft, memory, noop, options);
		expect(uploads).toBe(1);
		expect(deleted).toEqual(["old"]);
		expect(draft.saved).toMatchObject({ photos: ["keep", "new"], dlabel: "元旦" });
	});
});
