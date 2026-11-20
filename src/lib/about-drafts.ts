import type { Collection } from "./sync.svelte";
import type { AboutItem, Who } from "./types";

export type DraftResult = "saved" | "failed" | "duplicate";

export function hasAboutDraft(docs: Collection<AboutItem>["docs"], key: string, raw: string) {
	const t = raw.trim();
	return !!t && docs.some(({ data }) => `${data.cat}|${data.who}` === key && data.t?.trim() === t);
}

export async function saveAboutDraft(
	col: Pick<Collection<AboutItem>, "docs" | "add">,
	key: string,
	raw: string,
): Promise<DraftResult> {
	const [cat, who] = key.split("|") as [string, Who];
	const t = raw.trim();
	if (!t || !cat || (who !== "yi" && who !== "jq")) return "failed";
	if (hasAboutDraft(col.docs, key, raw)) return "duplicate";
	try {
		await col.add({ cat, who, t, c: Date.now() });
		return "saved";
	} catch {
		return "failed";
	}
}

type DraftStatus = DraftResult | "pending";

export function draftSummary(results: DraftStatus[], alreadySaved = 0) {
	const count = (status: DraftStatus) => results.filter((r) => r === status).length;
	const saved = alreadySaved + count("saved"), duplicate = count("duplicate"), failed = count("failed"), pending = count("pending");
	return [saved && `已保存 ${saved} 项`, duplicate && `${duplicate} 项已存在`, failed && `${failed} 项未保存`, pending && `${pending} 项待保存`].filter(Boolean).join("，");
}
