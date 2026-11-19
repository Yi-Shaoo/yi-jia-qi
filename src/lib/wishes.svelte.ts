import { toast } from "svelte-sonner";
import { DATES } from "./data/content";
import { session } from "./session.svelte";
import { useCollection } from "./sync.svelte";
import type { Who, Wish, WishCat } from "./types";

export const WISH_CATS: Record<WishCat, [string, string]> = {
	you: ["给对方的小心愿", "想和对方一起做、或想让对方为你做的小事"],
	place: ["旅行地点", "约会、Road-trip 和节日活动"],
	food: ["餐厅", "想一起去吃的店"],
};

/** 旧数据有的没有分类，按标题前缀猜一下 */
export function catOf(w: Wish): WishCat {
	if (w.cat === "mine") return "you";
	if (w.cat === "you" || w.cat === "place" || w.cat === "food") return w.cat;
	const t = w.t ?? "";
	if (t.startsWith("去吃 ")) return "food";
	if (t.startsWith("Road-trip：") || t.startsWith("感恩节：") || t.startsWith("圣诞节：")) return "place";
	if (DATES.some((d) => d.name === t)) return "place";
	return "you";
}

/** 是谁加的（旧数据只有 from 时用 from） */
export function byOf(w: Wish): Who | "" {
	if (w.by === "yi" || w.by === "jq") return w.by;
	if (catOf(w) === "you" && (w.from === "yi" || w.from === "jq")) return w.from;
	return "";
}

export function hasWish(t: string) {
	return useCollection("wishes").docs.some((d) => d.data.t === t);
}

export async function addWish(text: string, cat?: WishCat, from?: Who) {
	const t = text.trim().slice(0, 80);
	if (!t) return;
	const col = useCollection("wishes");
	if (col.docs.some((d) => d.data.t === t)) {
		toast("已经在心愿里了");
		return;
	}
	const w: Wish = { t, d: false, c: Date.now(), by: session.who ?? "" };
	w.cat = cat ?? catOf(w);
	if (w.cat === "you") w.from = from ?? session.who ?? "";
	try {
		await col.add(w);
		toast.success("加入心愿了");
	} catch {
		toast.error("没存上，再试一次");
	}
}
