import { createSubscriber } from "svelte/reactivity";
import { readLocal, writeLocal } from "../../local";
import type { Diary, Doc, Who } from "../../types";
import { diaryFields, entryForToday, hasWords, sideHasContent, textChanges, type DiaryFields } from "./entry";

export interface TextDraft {
	fields: Partial<DiaryFields>;
	at: number;
}

export interface EditorTarget {
	who: Who;
	item: Doc<Diary> | null;
	date: string;
	key: string;
	draft: TextDraft | null;
}

export type DiaryRequest = { id: string } | { draftKey: string } | { today: string };
const retired = new Set<string>();
let notify = () => {};
const trackDrafts = createSubscriber((update) => {
	notify = update;
	const storage = (e: StorageEvent) => { if (!e.key || e.key.startsWith("dydraft:")) update(); };
	window.addEventListener("storage", storage);
	window.addEventListener("pageshow", update);
	window.addEventListener("focus", update);
	return () => {
		notify = () => {};
		window.removeEventListener("storage", storage);
		window.removeEventListener("pageshow", update);
		window.removeEventListener("focus", update);
	};
});
export const entryDraftKey = (id: string, who: Who) => `dydraft:${id}:${who}`;
const newPrefix = (who: Who) => `dydraft:new:${who}`;
const isNewKey = (key: string, who: Who) => key === newPrefix(who) || key.startsWith(`${newPrefix(who)}:`);

function readDraft(key: string, legacySharedPlace?: string): TextDraft | null {
	trackDrafts();
	if (retired.has(key)) return null;
	const saved = readLocal<Record<string, unknown>>(key);
	if (!saved || typeof saved !== "object") return null;
	const fields: Partial<DiaryFields> = {};
	for (const name of ["date", "title", "place", "text", "fav"] as const) {
		if (typeof saved[name] === "string") fields[name] = saved[name];
	}
	if (saved.kind === "apart" || saved.kind === "together") fields.kind = saved.kind;
	const legacyForm = saved.version === undefined && fields.date !== undefined && fields.kind && fields.title !== undefined && fields.text !== undefined && fields.fav !== undefined;
	if (legacyForm && legacySharedPlace && fields.place === legacySharedPlace) delete fields.place;
	return Object.keys(fields).length ? { fields, at: typeof saved.at === "number" ? saved.at : 0 } : null;
}

export function saveTextDraft(key: string, changes: Partial<DiaryFields>, at: number): boolean {
	if (!writeLocal(key, { ...changes, at, version: 2 })) return false;
	retired.delete(key);
	notify();
	return true;
}

export function clearTextDraft(key: string, finished = false): boolean {
	if (writeLocal(key, null)) {
		retired.delete(key);
		notify();
		return true;
	}
	if (finished) { retired.add(key); notify(); }
	return false;
}

export function newDrafts(who: Who): { key: string; draft: TextDraft }[] {
	trackDrafts();
	const entries: { key: string; draft: TextDraft }[] = [];
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || !isNewKey(key, who)) continue;
			const draft = readDraft(key);
			if (draft && hasWords(draft.fields)) entries.push({ key, draft });
		}
	} catch {
		return [];
	}
	return entries.sort((a, b) => b.draft.at - a.draft.at);
}

export function entryDraft(item: Doc<Diary>, who: Who): TextDraft | null {
	const legacySharedPlace = who === "jq" && item.data.jq?.pl == null && !item.data.yi?.pl ? item.data.place : undefined;
	const draft = readDraft(entryDraftKey(item.id, who), legacySharedPlace);
	if (!draft) return null;
	const base = diaryFields(item.data, who, item.data.date);
	return textChanges(base, { ...base, ...draft.fields }, false) ? draft : null;
}

function dateTarget(docs: Doc<Diary>[], who: Who, date: string) {
	const item = entryForToday(docs, date);
	if (item) return { item, key: entryDraftKey(item.id, who), draft: entryDraft(item, who) };
	const found = newDrafts(who).find(({ draft }) => draft.fields.date === date);
	return { item: null, key: found?.key, draft: found?.draft ?? null };
}

export function todayDiaryAction(diary: { ready: boolean; docs: Doc<Diary>[] }, who: Who | null, date: string) {
	const target = diary.ready && who ? dateTarget(diary.docs, who, date) : null;
	const entry = target?.item?.data;
	const label = !target || !who ? "今日日记" : target.draft ? "继续写草稿" : sideHasContent(entry?.[who]) ? "改我的这一边" : "写下今天";
	return { entry, itemId: target?.item?.id, draftKey: target?.draft ? target.key : undefined, label } as const;
}

export function resolveEditor(
	collection: { status: "loading" | "ready" | "error"; docs: Doc<Diary>[] },
	who: Who,
	request: DiaryRequest,
): EditorTarget | null {
	if (collection.status !== "ready") return null;
	if ("draftKey" in request) {
		const key = request.draftKey;
		const draft = isNewKey(key, who) ? readDraft(key) : null;
		return draft && hasWords(draft.fields) ? { who, item: null, date: draft.fields.date ?? "", key, draft } : null;
	}
	if ("id" in request) {
		const item = collection.docs.find((d) => d.id === request.id);
		return item ? { who, item, date: item.data.date, key: entryDraftKey(item.id, who), draft: entryDraft(item, who) } : null;
	}
	const { item, key, draft } = dateTarget(collection.docs, who, request.today);
	return { who, item, date: request.today, key: key ?? `${newPrefix(who)}:${crypto.getRandomValues(new Uint32Array(2)).join("-")}`, draft };
}
