import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Diary, Doc } from "../../src/lib/types";
import { clearTextDraft, entryDraft, entryDraftKey, newDrafts, resolveEditor, saveTextDraft, todayDiaryAction } from "../../src/lib/components/diary/drafts";
import { deletionDescription, diaryFields, invalidField, publication, savedPhotos, textChanges } from "../../src/lib/components/diary/entry";

const day = "2099-06-07";
const yesterday = "2099-06-06";
const side = { t: "", fav: "", photo: "" };
const doc = (id: string, c: number, extra: Partial<Diary> = {}): Doc<Diary> => ({
	id, updated: c, data: { date: day, kind: "apart", title: id, c, yi: { ...side }, jq: { ...side }, ...extra },
});
const first = doc("第一站", 1);
const second = doc("第二站", 2);
const ready = { status: "ready" as const, docs: [second, first] };

class SampleStorage {
	rows = new Map<string, string>();
	blocked = false;
	get length() { return this.rows.size; }
	key(i: number) { return Array.from(this.rows.keys())[i] ?? null; }
	getItem(k: string) { return this.rows.get(k) ?? null; }
	setItem(k: string, v: string) { if (this.blocked) throw new Error("quota"); this.rows.set(k, v); }
	removeItem(k: string) { if (this.blocked) throw new Error("denied"); this.rows.delete(k); }
}

const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
let storage: SampleStorage;
beforeEach(() => {
	storage = new SampleStorage();
	Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
});
afterEach(() => {
	if (original) Object.defineProperty(globalThis, "localStorage", original);
	else Reflect.deleteProperty(globalThis, "localStorage");
});

describe("日记入口与文字草稿", () => {
	test("载入成功之前，三个入口均不能创建或编辑，即使有缓存", () => {
		for (const status of ["loading", "error"] as const) {
			const collection = { ...ready, status };
			for (const request of [{ id: second.id }, { today: day }, { draftKey: "dydraft:new:yi" }]) {
				expect(resolveEditor(collection, "yi", request)).toBeNull();
			}
		}
	});

	test("卡片精确取 ID，过期 ID 不转为新建；只有写今天按日期取同一天最早的记录", () => {
		expect(resolveEditor(ready, "yi", { id: second.id })?.item?.id).toBe(second.id);
		expect(resolveEditor(ready, "yi", { id: "已经删除" })).toBeNull();
		expect(resolveEditor(ready, "yi", { today: day })?.item?.id).toBe(first.id);
	});

	test("写今天不加载昨天的旧版草稿，继续写不误认同日已发布的日记", () => {
		const legacy = "dydraft:new:yi";
		saveTextDraft(legacy, { date: yesterday, text: "昨天的草稿" }, 1);
		const collection = { ...ready, docs: [doc("昨天的另一篇", 3, { date: yesterday })] };
		const today = resolveEditor(collection, "yi", { today: day })!;
		expect(today.draft).toBeNull();
		expect(today.key).not.toBe(legacy);
		saveTextDraft(today.key, { date: day, text: "今天的草稿" }, 2);
		expect(resolveEditor(collection, "yi", { today: day })?.draft?.fields.text).toBe("今天的草稿");
		expect(resolveEditor(collection, "yi", { draftKey: legacy })).toMatchObject({ item: null, date: yesterday, draft: { fields: { text: "昨天的草稿" } } });
		expect(resolveEditor(collection, "jq", { draftKey: legacy })).toBeNull();
		clearTextDraft(today.key, true);
		expect(newDrafts("yi").map((d) => d.key)).toEqual([legacy]);
		expect(resolveEditor(collection, "yi", { draftKey: today.key })).toBeNull();
	});

	test("今日入口与编辑器按同一目标判断；独立、同日另篇及另一账号草稿互不冒用", () => {
		const action = (docs = ready.docs, who: "yi" | "jq" = "yi") => todayDiaryAction({ ready: true, docs }, who, day);
		const legacy = "dydraft:new:yi";
		const newer = `${legacy}:other`;
		saveTextDraft(legacy, { date: day, text: "旧版独立草稿" }, 1);
		expect(action([])).toMatchObject({ label: "继续写草稿", draftKey: legacy });
		saveTextDraft(newer, { date: day, title: "同日另一份独立草稿" }, 2);
		expect(action([]).draftKey).toBe(newer);
		expect(resolveEditor({ ...ready, docs: [] }, "yi", { today: day })?.key).toBe(newer);
		saveTextDraft(entryDraftKey(second.id, "yi"), { text: "另篇修改" }, 3);
		saveTextDraft(entryDraftKey(first.id, "jq"), { text: "对方修改" }, 4);
		expect(action()).toMatchObject({ label: "写下今天", itemId: first.id, draftKey: undefined });
		expect(action(ready.docs, "jq").draftKey).toBe(entryDraftKey(first.id, "jq"));
		const key = entryDraftKey(first.id, "yi");
		saveTextDraft(key, { title: "改标题" }, 5);
		expect(action()).toMatchObject({ label: "继续写草稿", itemId: first.id, draftKey: key });
		expect(resolveEditor(ready, "yi", { today: day })?.key).toBe(key);
		expect(resolveEditor(ready, "yi", { draftKey: legacy })?.item).toBeNull();
	});

	test("只恢复本人在本篇修改的字段，共用类型、标题和清空地点均可恢复", () => {
		const record = doc(second.id, 2, { yi: { ...side, pl: "原地点", t: "原文" } });
		const base = diaryFields(record.data, "yi", day);
		const changes = textChanges(base, { ...base, kind: "together", title: "新标题", place: "" }, false)!;
		expect(changes).toEqual({ kind: "together", title: "新标题", place: "" });
		const key = entryDraftKey(record.id, "yi");
		saveTextDraft(key, changes, 12);
		expect(entryDraft(record, "yi")).toEqual({ fields: changes, at: 12 });
		expect(entryDraft(record, "jq")).toBeNull();
		expect(entryDraft(first, "yi")).toBeNull();
		expect(textChanges(base, base, false)).toBeNull();
		expect(entryDraft({ ...record, data: { ...record.data, kind: "together", title: "新标题", yi: { ...record.data.yi, pl: "" } } }, "yi")).toBeNull();
	});

	test("旧整表草稿不恢复曾自动填入的共享地点；本人另填的地点和新版显式同名地点仍恢复", () => {
		const record = doc("旧日记", 1, { place: "宿舍" });
		const key = entryDraftKey(record.id, "jq");
		const fields = { ...diaryFields(record.data, "jq", day), place: "宿舍", text: "补写的正文" };
		storage.setItem(key, JSON.stringify({ ...fields, at: 1 }));
		expect(entryDraft(record, "jq")?.fields).not.toHaveProperty("place");
		expect(entryDraft(record, "jq")?.fields.text).toBe("补写的正文");
		storage.setItem(key, JSON.stringify({ ...fields, place: "学校", at: 1 }));
		expect(entryDraft(record, "jq")?.fields.place).toBe("学校");
		saveTextDraft(key, fields, 2);
		expect(entryDraft(record, "jq")).toEqual({ fields, at: 2 });
	});

	test("本机写入失败不冒报成功；已发布草稿即使清理失败也不在本次会话恢复", () => {
		const key = "dydraft:new:yi:sample-blocked";
		saveTextDraft(key, { date: day, text: "已落盘" }, 1);
		storage.blocked = true;
		expect(saveTextDraft(key, { date: day, text: "未落盘" }, 2)).toBe(false);
		expect(newDrafts("yi")[0]?.draft.fields.text).toBe("已落盘");
		expect(clearTextDraft(key, true)).toBe(false);
		expect(newDrafts("yi")).toEqual([]);
	});
});

describe("日记发布与整篇删除", () => {
	test("正文、瞬间、照片任选一项；地点及标题可存文字草稿，但不能单独发布", () => {
		const empty = diaryFields(undefined, "yi", day);
		expect(textChanges(empty, empty, true)).toBeNull();
		for (const fields of [{ title: "共用标题" }, { place: "我的地点" }]) {
			const f = { ...empty, ...fields };
			expect(textChanges(empty, f, true)).toEqual(f);
			expect(invalidField(f, false)).toBe("text");
		}
		expect(invalidField({ ...empty, text: " \t", fav: "　" }, false)).toBe("text");
		expect(invalidField({ ...empty, text: "正文" }, false)).toBeNull();
		expect(invalidField({ ...empty, fav: "瞬间" }, false)).toBeNull();
		expect(invalidField(empty, true)).toBeNull();
		expect(invalidField({ ...empty, kind: "together", title: " " }, true)).toBe("title");
		expect(invalidField({ ...empty, kind: "together", title: "散步" }, true)).toBeNull();
		expect(invalidField({ ...empty, date: "" }, true)).toBe("date");
	});

	test("只修改本人及改过的共用字段，不覆盖对方刚改的标题和照片", () => {
		const base = diaryFields(second.data, "yi", day);
		const current = { ...second.data, title: "对方的新标题", yi: { ...side, photo: "已存照片" }, jq: { ...side, t: "对方正文" } };
		const { patch } = publication(base, { ...base, date: yesterday, text: " 我的新正文 " }, "yi", current);
		expect(patch).toEqual({ date: yesterday, yi: { t: "我的新正文", fav: "", photo: "已存照片" } });
		expect(publication(base, { ...base, title: "改共用标题" }, "yi", current).patch).toEqual({ title: "改共用标题" });
		expect(publication(base, { ...base, title: "", fav: "今天" }, "yi", current, "").patch).toEqual({ title: "", yi: { ...side, fav: "今天" } });
	});

	test("旧共享地点不填入个人表单或文字草稿；发布文字时保留远端个人地点", () => {
		const record = doc("旧日记", 1, { place: "宿舍" });
		for (const who of ["jq", "yi"] as const) {
			const base = diaryFields(record.data, who, day);
			expect(base.place).toBe("");
			const form = { ...base, text: "新正文" };
			const changes = textChanges(base, form, false)!;
			expect(changes).toEqual({ text: "新正文" });
			saveTextDraft(entryDraftKey(record.id, who), changes, 1);
			expect(entryDraft(record, who)?.fields).toEqual(changes);
			expect(publication(base, form, who, record.data).patch).toEqual({ [who]: { ...side, t: "新正文" } });
			const remote = { ...record.data, [who]: { ...side, pl: "图书馆" } };
			expect(publication(base, form, who, remote).patch).toEqual({ [who]: { ...side, pl: "图书馆", t: "新正文" } });
			const withPlace = { ...base, place: record.data.place! };
			expect(publication(base, withPlace, who, remote).patch).toEqual({ [who]: { ...side, pl: "宿舍" } });
			expect(publication(withPlace, base, who, remote).patch).toEqual({ [who]: { ...side, pl: "" } });
		}
	});

	test("新日记不写共享地点，旧草稿中的共享地点不恢复或转为个人地点", () => {
		const base = diaryFields(undefined, "yi", day);
		const { entry } = publication(base, { ...base, kind: "together", title: "读书", text: "一起读书" }, "yi");
		expect(entry).not.toHaveProperty("place");
		expect(entry.yi).not.toHaveProperty("pl");
		const record = doc("meet", 1, { ...entry, place: "公园" });
		storage.setItem(entryDraftKey(record.id, "jq"), JSON.stringify({ sharedPlace: "书店", text: "我的记录", at: 10, version: 2 }));
		expect(entryDraft(record, "jq")?.fields).toEqual({ text: "我的记录" });
	});

	test("删除说明使用已保存的篇名、日期、两人和真实照片数；零张不报数", () => {
		const d = { ...second.data, yi: { ...side, photo: "a" }, jq: { ...side, photo: "b" } };
		expect(deletionDescription(d)).toContain(`${day}《第二站》`);
		expect(deletionDescription(d)).toContain("Yi 和 Jia Qi 两人的日记和 2 张照片");
		expect(deletionDescription(d)).toContain("无法撤销");
		expect(deletionDescription({ ...d, jq: side })).toContain("1 张照片");
		expect(deletionDescription({ ...d, yi: side, jq: side })).not.toContain("张照片");
		expect(savedPhotos({ ...d, jq: d.yi })).toEqual(["a"]);
	});
});
