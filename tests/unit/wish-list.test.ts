import { expect, mock, test } from "bun:test";
import { DATES } from "../../src/lib/data/content";
import { byOf, catOf, findWish, saveWish, wishHref } from "../../src/lib/wish-list";
import type { Doc, Wish } from "../../src/lib/types";

const doc = (data: Wish, id = "wish-1"): Doc<Wish> => ({ id, data, updated: 1 });
const base: Wish = { t: "看日落", d: false, c: 1 };
function collection(docs: Doc<Wish>[] = []) {
	return {
		docs, ready: true, load: mock(async (): Promise<void> => {}),
		add: mock(async (wish: Wish) => {
			const saved = doc(wish, `wish-${docs.length + 1}`);
			docs.push(saved);
			return saved;
		}),
	};
}

test("新入口的显式分类优先；旧分类和无分类标题仍可读", async () => {
	expect(catOf({ t: "去吃 老地方", cat: "mine" })).toBe("you");
	expect(catOf({ t: "去吃 老地方", cat: "" })).toBe("food");
	for (const t of [DATES[0].name, "Road-trip：小路", "感恩节：灯会", "圣诞节：公园"]) expect(catOf({ t })).toBe("place");
	expect(catOf(base)).toBe("you");
	const c = collection();
	await saveWish(c, "新建海风步道", "yi", "place", "jq");
	await saveWish(c, "自建小馆", "jq", "food");
	expect(c.docs.map((d) => [d.data.cat, d.data.by, d.data.from])).toEqual([["place", "yi", undefined], ["food", "jq", undefined]]);
});

test("添加者与谁想要分别存储；缺失的添加者不由想要人推定", async () => {
	const c = collection();
	await saveWish(c, base.t, "yi", "you", "jq");
	expect(c.docs[0].data).toMatchObject({ t: base.t, cat: "you", by: "yi", from: "jq" });
	expect(byOf({ ...base, cat: "mine", from: "jq" })).toBe("");
	const result = await saveWish(c, `  ${base.t} `, "jq", "place");
	expect(result).toEqual({ status: "duplicate", doc: c.docs[0] });
	expect(c.add).toHaveBeenCalledTimes(1);
	expect(c.docs[0].data).toMatchObject({ cat: "you", by: "yi", from: "jq" });
});

test("未读完不写入；已有条目指向实际 id，不依赖卡上的分类", async () => {
	const c = collection();
	c.ready = false;
	const gate = Promise.withResolvers<void>();
	const stored = doc({ ...base, cat: "mine" }, "old-document");
	c.load.mockImplementation(async () => { await gate.promise; c.docs.push(stored); c.ready = true; });
	const result = saveWish(c, base.t, "yi", "place");
	expect(c.add).not.toHaveBeenCalled();
	gate.resolve();
	expect(await result).toEqual({ status: "duplicate", doc: stored });
	expect(c.add).not.toHaveBeenCalled();
	expect(wishHref(stored.id)).toBe("/wish?item=old-document");
});

test("并发点击同一心愿只写一次，两个入口都得到准确的文档", async () => {
	const c = collection();
	const gate = Promise.withResolvers<void>();
	c.add.mockImplementation(async (wish) => {
		await gate.promise;
		const saved = doc(wish);
		c.docs.push(saved);
		return saved;
	});
	const first = saveWish(c, "  " + "地点".repeat(45), "yi", "place");
	const second = saveWish(c, "地点".repeat(45), "jq", "food");
	expect(c.add).toHaveBeenCalledTimes(1);
	gate.resolve();
	expect(await first).toEqual({ status: "added", doc: c.docs[0] });
	expect(await second).toEqual({ status: "duplicate", doc: c.docs[0] });
	expect(findWish(c.docs, "地点".repeat(45))).toEqual(c.docs[0]);
	expect(c.docs[0].data).toMatchObject({ t: "地点".repeat(40), by: "yi", cat: "place" });
});

test("长标题优先定位完整匹配的旧条目", () => {
	const prefix = "x".repeat(80);
	const docs = [doc({ ...base, t: prefix }, "truncated"), doc({ ...base, t: prefix + "a" }, "full")];
	expect(findWish(docs, prefix + "a")?.id).toBe("full");
	expect(findWish(docs, prefix + "b")?.id).toBe("truncated");
});

test("写入已落库但回应丢失，重试先核对文档，不会再 POST", async () => {
	const c = collection();
	const persisted = doc({ ...base, cat: "you", from: "jq", by: "yi" }, "persisted");
	c.add.mockRejectedValueOnce(new Error("connection lost"));
	c.load.mockImplementationOnce(async () => { c.docs.push(persisted); });
	expect((await saveWish(c, base.t, "yi", "you", "jq")).status).toBe("error");
	expect(await saveWish(c, base.t, "yi", "you", "jq")).toEqual({ status: "duplicate", doc: persisted });
	expect(c.load).toHaveBeenCalledTimes(1);
	expect(c.add).toHaveBeenCalledTimes(1);
});

test("读取失败不冒充空列表，写入失败可重试", async () => {
	const c = collection();
	c.ready = false;
	c.load.mockRejectedValueOnce(new Error("offline"));
	expect((await saveWish(c, base.t, "jq")).status).toBe("error");
	expect(c.add).not.toHaveBeenCalled();
	c.ready = true;
	c.add.mockRejectedValueOnce(new Error("offline"));
	expect((await saveWish(c, base.t, "jq")).status).toBe("error");
	expect((await saveWish(c, base.t, "jq")).status).toBe("added");
	expect(c.docs[0].data).toMatchObject({ from: "jq", by: "jq" });
	expect((await saveWish(c, "  ", "yi")).status).toBe("empty");
	expect(c.add).toHaveBeenCalledTimes(2);
});
