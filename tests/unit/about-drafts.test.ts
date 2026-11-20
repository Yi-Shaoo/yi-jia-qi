import { expect, mock, test } from "bun:test";
import { draftSummary, hasAboutDraft, saveAboutDraft } from "../../src/lib/about-drafts";
import type { AboutItem, Doc } from "../../src/lib/types";

const stored: Doc<AboutItem> = { id: "known", updated: 1, data: { cat: "animal", who: "yi", t: "海獭", c: 1 } };

test("全部保存只计成功写入；失败和已有项单独报告", async () => {
	const col = {
		docs: [stored],
		add: mock(async (data: AboutItem) => {
			if (data.who === "jq") throw Error("offline");
			return { id: "new", updated: 2, data };
		}),
	};
	const results = await Promise.all([
		saveAboutDraft(col, "food|yi", " 海獭 "),
		saveAboutDraft(col, "animal|jq", " 海獭 "),
		saveAboutDraft(col, "animal|yi", " 海獭 "),
	]);
	expect(results).toEqual(["saved", "failed", "duplicate"]);
	expect(draftSummary(results)).toBe("已保存 1 项，1 项已存在，1 项未保存");
	expect(col.add).toHaveBeenCalledTimes(2);
});

test("按分类和人判断去掉首尾空格的重复项，不拦其他输入", () => {
	const docs = [{ ...stored, data: { ...stored.data, t: " 海獭 " } }];
	expect(hasAboutDraft(docs, "animal|yi", "海獭 ")).toBe(true);
	for (const [key, value] of [["food|yi", "海獭"], ["animal|jq", "海獭"], ["animal|yi", "小海獭"], ["animal|yi", " "]]) {
		expect(hasAboutDraft(docs, key, value)).toBe(false);
	}
});

test("部分失败与全部失败的计数不冲突", () => {
	expect(draftSummary(["duplicate", "pending"], 1)).toBe("已保存 1 项，1 项已存在，1 项待保存");
	expect(draftSummary(["failed", "failed"])).toBe("2 项未保存");
	expect(draftSummary(["failed", "saved"])).toBe("已保存 1 项，1 项未保存");
	expect(draftSummary(["duplicate"])).toBe("1 项已存在");
	expect(draftSummary(["saved", "saved"])).toBe("已保存 2 项");
});
