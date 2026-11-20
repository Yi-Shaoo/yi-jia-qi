import { expect, test } from "bun:test";
import { todayDiaryAction } from "../../src/lib/components/diary/drafts";
import type { Diary, Doc } from "../../src/lib/types";

const date = "2026-11-10";
const blank = { t: " \n", fav: "", photo: "", pl: "Westwood" };
const doc = (id: string, patch: Partial<Diary>): Doc<Diary> => ({ id, updated: 1,
	data: { date, c: 1, kind: "apart", title: "共享标题", yi: blank, jq: blank, ...patch },
});

test("今日入口依实际编辑目标和当前账号判断，正文、瞬间、照片任选一项", () => {
	const later = doc("later", { c: 2, jq: { ...blank, t: "另一篇" } });
	for (const content of [{ t: "正文" }, { fav: "瞬间" }, { photo: "photo-id" }]) {
		const first = doc("first", { yi: { ...blank, ...content } });
		const diary = { ready: true, docs: [later, first] };
		expect(todayDiaryAction(diary, "yi", date)).toMatchObject({ label: "改我的这一边", itemId: first.id, entry: first.data });
		expect(todayDiaryAction(diary, "jq", date)).toMatchObject({ label: "写下今天", entry: first.data });
		expect(todayDiaryAction(diary, "yi", "2026-11-11")).toMatchObject({ label: "写下今天", entry: undefined });
	}
});

test("未读就绪或未确认账号时，即使有缓存也不猜测写改", () => {
	const docs = [doc("cached", { yi: { ...blank, t: "缓存" } })];
	const neutral = { label: "今日日记", entry: undefined, itemId: undefined, draftKey: undefined };
	expect(todayDiaryAction({ ready: false, docs }, "yi", date)).toEqual(neutral);
	expect(todayDiaryAction({ ready: true, docs }, null, date)).toEqual(neutral);
});
