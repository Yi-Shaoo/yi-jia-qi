import { expect, test } from "bun:test";
import { todayKey } from "../../src/lib/dates";
import { createMemoryDraft } from "../../src/lib/memory-draft";
import { groupMemories, isMemoryDate } from "../../src/lib/memory-timeline";
import type { Memory } from "../../src/lib/types";

const record = (id: string, fields: Partial<Memory>) => ({ id, updated: 1, data: { date: "2024-02-29", title: "旧回忆", c: 1, text: "", photos: [], ...fields } });

test("待整理仅收录真实日期或非空标题缺失的记录，不改变原数组及时间线排序", () => {
	const rows = [record("a", {}), record("b", { date: "2024-02-30" }), record("c", { title: "　" }), record("d", { c: 2 }), record("e", { date: "2026-01-01" }), record("f", { title: undefined })];
	const { timeline, pending } = groupMemories(rows);
	expect(timeline.map((r) => r.id)).toEqual(["e", "d", "a"]);
	expect(pending.map((r) => r.id)).toEqual(["b", "c", "f"]);
	expect(rows.map((r) => r.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
});

test("旧回忆日期不能填今天或推测；只有新建允许默认今天", () => {
	for (const date of ["", undefined, "未知", "2023-02-29", "2024-00-04", "2024-13-01", "0000-01-01"]) {
		expect(isMemoryDate(date)).toBe(false);
		expect(createMemoryDraft(record("old", { date })).date).toBe("");
	}
	expect(createMemoryDraft(record("old", {})).date).toBe("2024-02-29");
	expect(createMemoryDraft(null).date).toBe(todayKey());
});
