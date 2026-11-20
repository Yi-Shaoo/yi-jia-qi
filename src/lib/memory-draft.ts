import { todayKey } from "./dates";
import { isMemoryDate } from "./memory-timeline";
import { uploadBatch, type SelectedPhoto } from "./photo-batch";
import type { Collection } from "./sync.svelte";
import type { Doc, Memory } from "./types";
import { deletePhoto, uploadPhoto } from "./upload";

type NewPhoto = SelectedPhoto & { preview: string };
type DraftPhoto = { asset: string } | NewPhoto;

export interface MemoryDraft {
	id: string;
	created: number;
	saved: Memory | null;
	unconfirmedPhotos: string[] | null;
	date: string;
	title: string;
	text: string;
	photos: DraftPhoto[];
}

export function createMemoryDraft(item: Doc<Memory> | null): MemoryDraft {
	return {
		id: item?.id ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) => n.toString(16).padStart(2, "0")).join(""),
		created: item?.data.c ?? Date.now(),
		saved: item?.data ?? null,
		unconfirmedPhotos: null,
		date: !item ? todayKey() : isMemoryDate(item.data.date) ? item.data.date : "",
		title: typeof item?.data.title === "string" ? item.data.title : "",
		text: item?.data.text ?? "",
		photos: (item?.data.photos ?? []).map((asset) => ({ asset })),
	};
}

export function releasePreview(photo: DraftPhoto) {
	if ("preview" in photo) URL.revokeObjectURL(photo.preview);
}

export async function saveMemoryDraft(
	draft: MemoryDraft,
	memories: Pick<Collection<Memory>, "set" | "update">,
	onProgress: (position: number, total: number) => void,
	{ upload, remove = deletePhoto }: { upload?: typeof uploadPhoto; remove?: typeof deletePhoto } = {},
) {
	const selected = draft.photos.filter((p): p is NewPhoto => "file" in p);
	await uploadBatch(selected.filter((p) => !p.asset), { upload, onProgress });
	const before = draft.saved;
	const data = {
		date: draft.date,
		title: before?.title === draft.title ? before.title : draft.title.trim().slice(0, 40),
		text: before?.text === draft.text ? before.text : draft.text.trim().slice(0, 600),
		photos: draft.photos.flatMap((p) => (p.asset ? [p.asset] : [])),
	};
	const original = before?.photos ?? [];
	const changed = !before || before.title !== data.title || before.date !== data.date || (before.text ?? "") !== data.text ||
		original.length !== data.photos.length || original.some((id, i) => id !== data.photos[i]);
	if (changed || draft.unconfirmedPhotos) {
		draft.unconfirmedPhotos = [...new Set([...(draft.unconfirmedPhotos ?? []), ...data.photos])];
		const record = before
			? await memories.update(draft.id, data)
			: await memories.set(draft.id, { ...data, c: draft.created });
		if (record.id !== draft.id || !Array.isArray(record.data?.photos)) throw new Error("memory-receipt");
		draft.saved = record.data;
		for (const id of new Set([...original, ...draft.unconfirmedPhotos])) if (!record.data.photos.includes(id)) void remove(id);
		draft.unconfirmedPhotos = null;
	}
	draft.photos = draft.photos.map((p) => {
		if (!("file" in p) || !p.asset) return p;
		releasePreview(p);
		return { asset: p.asset };
	});
	return selected.filter((p) => p.error).length;
}
