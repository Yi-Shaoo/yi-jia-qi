import { toast } from "svelte-sonner";
import { session } from "./session.svelte";
import { useCollection } from "./sync.svelte";
import { WISH_CATS, catOf, saveWish } from "./wish-list";
import type { Who, WishCat } from "./types";

export { WISH_CATS, byOf, catOf, findWish, wishHref } from "./wish-list";

export const wishNotice = (id: string) => `wish-added:${id}`;

export async function addWish(text: string, cat?: WishCat, from?: Who, notify = true) {
	const result = await saveWish(useCollection("wishes"), text, session.who, cat, from);
	if (notify) {
		if (result.status === "added") toast.success(`已加入${WISH_CATS[catOf(result.doc.data)]}`, { id: wishNotice(result.doc.id) });
		else if (result.status === "duplicate") toast("已经在心愿里了", { id: wishNotice(result.doc.id) });
		else if (result.status === "error") toast.error(result.message);
	}
	return result;
}
