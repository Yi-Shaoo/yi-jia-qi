import { isDateKey } from "../../dates";
import type { Diary, DiarySide, Doc, Who } from "../../types";

export interface DiaryFields {
	date: string;
	kind: Diary["kind"];
	title: string;
	place: string;
	text: string;
	fav: string;
}

export const diaryTitle = (d: Diary) => d.title?.trim() || `${isDateKey(d.date) ? `${Number(d.date.slice(5, 7))} 月 ${Number(d.date.slice(8))} 日的` : ""}${d.kind === "apart" ? "日记" : "约会"}`;
export const sideHasContent = (s?: DiarySide) => !!(s?.t?.trim() || s?.fav?.trim() || s?.photo);
export const hasWords = (f: Partial<DiaryFields>) => !!(f.title?.trim() || f.place?.trim() || f.text?.trim() || f.fav?.trim());

export function diaryFields(d: Diary | undefined, who: Who, date: string): DiaryFields {
	const side = d?.[who];
	return {
		date: d?.date ?? date,
		kind: d?.kind ?? "apart",
		title: d?.title ?? "",
		place: side?.pl ?? "",
		text: side?.t ?? "",
		fav: side?.fav ?? "",
	};
}

export function textChanges(base: DiaryFields, form: DiaryFields, isNew: boolean): Partial<DiaryFields> | null {
	if (isNew) return hasWords(form) ? { ...form } : null;
	const changes = Object.fromEntries(Object.entries(form).filter(([key, value]) => value !== base[key as keyof DiaryFields]));
	return Object.keys(changes).length ? changes : null;
}

export function invalidField(form: DiaryFields, hasPhoto: boolean): "date" | "title" | "text" | null {
	if (!isDateKey(form.date)) return "date";
	if (form.kind === "together" && !form.title.trim()) return "title";
	if (!form.text.trim() && !form.fav.trim() && !hasPhoto) return "text";
	return null;
}

export function publication(base: DiaryFields, form: DiaryFields, who: Who, current?: Diary, changedPhoto?: string) {
	const fields = current ? { ...diaryFields(current, who, form.date), ...textChanges(base, form, false) } : form;
	const existing = current?.[who];
	const side: DiarySide = {
		...existing,
		t: existing && base.text === form.text ? existing.t : fields.text.trim().slice(0, 800),
		fav: existing && base.fav === form.fav ? existing.fav : fields.fav.trim().slice(0, 80),
		...(!current || base.place !== form.place ? { pl: fields.place.trim().slice(0, 40) } : {}),
		photo: changedPhoto ?? existing?.photo ?? "",
	};
	const shared = { date: fields.date, kind: fields.kind, title: fields.title.trim().slice(0, 40) };
	const patch: Partial<Diary> = {};
	if (!current || base.text !== form.text || base.fav !== form.fav || base.place !== form.place || changedPhoto !== undefined) patch[who] = side;
	if (!current || base.date !== form.date) patch.date = shared.date;
	if (!current || base.kind !== form.kind) patch.kind = shared.kind;
	if (!current || base.title !== form.title) patch.title = shared.title;
	const empty: DiarySide = { t: "", fav: "", photo: "" };
	return { fields, side, patch, entry: { ...shared, yi: empty, jq: empty, [who]: side, c: Date.now() } satisfies Diary };
}

export function entryForToday(docs: Doc<Diary>[], date: string) {
	return docs.filter((d) => d.data.date === date).sort((a, b) => (a.data.c ?? 0) - (b.data.c ?? 0) || a.id.localeCompare(b.id))[0] ?? null;
}

export function savedPhotos(d: Diary): string[] {
	return [...new Set([d.yi?.photo, d.jq?.photo].filter(Boolean))];
}

export function deletionDescription(d: Diary): string {
	const count = savedPhotos(d).length;
	return `将删除 ${d.date}《${diaryTitle(d)}》中 Yi 和 Jia Qi 两人的日记${count ? `和 ${count} 张照片` : ""}，并清除本机对应的草稿。无法撤销。`;
}
