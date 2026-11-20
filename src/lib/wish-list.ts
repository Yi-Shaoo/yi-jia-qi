import { DATES } from "./data/content";
import type { Collection } from "./sync.svelte";
import type { Doc, Who, Wish, WishCat } from "./types";

export const WISH_CATS: Record<WishCat, string> = {
	you: "给对方的小心愿",
	place: "旅行地点",
	food: "餐厅",
};

export function catOf(w: Pick<Wish, "t" | "cat">): WishCat {
	if (w.cat === "mine") return "you";
	if (w.cat === "you" || w.cat === "place" || w.cat === "food") return w.cat;
	const t = w.t ?? "";
	if (t.startsWith("去吃 ")) return "food";
	if (t.startsWith("Road-trip：") || t.startsWith("感恩节：") || t.startsWith("圣诞节：")) return "place";
	if (DATES.some((d) => d.name === t)) return "place";
	return "you";
}

export function byOf(w: Wish): Who | "" {
	return w.by === "yi" || w.by === "jq" ? w.by : "";
}

function wishText(text: string) {
	return text.trim().slice(0, 80).trimEnd();
}

export function findWish(docs: readonly Doc<Wish>[], text: string) {
	const full = text.trim();
	if (!full) return undefined;
	const exact = docs.find((d) => d.data.t?.trim() === full);
	if (exact || full.length <= 80) return exact;
	const shortened = wishText(full);
	return docs.find((d) => d.data.t?.trim() === shortened);
}

export const wishHref = (id: string) => `/wish?item=${encodeURIComponent(id)}`;

type WishCollection = Pick<Collection<Wish>, "ready" | "load" | "docs" | "add">;
export type WishResult =
	| { status: "added" | "duplicate"; doc: Doc<Wish> }
	| { status: "error"; message: string }
	| { status: "empty" };

const inFlight = new WeakMap<WishCollection, Map<string, Promise<Doc<Wish>>>>();
const needsRead = new WeakSet<WishCollection>();

export async function saveWish(
	col: WishCollection,
	text: string,
	author: Who | null,
	cat?: WishCat,
	from?: Who,
): Promise<WishResult> {
	const t = wishText(text);
	if (!t) return { status: "empty" };
	if (!author) return { status: "error", message: "请先登录" };
	if (!col.ready || needsRead.has(col)) {
		try {
			await col.load();
			needsRead.delete(col);
		} catch {
			return { status: "error", message: "没能载入心愿清单，请重试" };
		}
	}
	const existing = findWish(col.docs, text);
	if (existing) return { status: "duplicate", doc: existing };

	const pending = inFlight.get(col) ?? new Map<string, Promise<Doc<Wish>>>();
	inFlight.set(col, pending);
	const writing = pending.get(t);
	try {
		if (writing) return { status: "duplicate", doc: await writing };
		const category = cat ?? catOf({ t });
		const wish: Wish = { t, d: false, c: Date.now(), by: author, cat: category };
		if (category === "you") wish.from = from ?? author;
		const request = col.add(wish);
		pending.set(t, request);
		return { status: "added", doc: await request };
	} catch {
		needsRead.add(col);
		return { status: "error", message: "心愿没能保存，请重试" };
	} finally {
		if (!writing) pending.delete(t);
	}
}
