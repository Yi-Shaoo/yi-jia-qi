import { isDateKey } from "./dates";
import type { Doc, Memory } from "./types";

export function isMemoryDate(value: unknown): value is string {
	if (!isDateKey(value) || value.startsWith("0000-")) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function memoryTitle(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

export function groupMemories(docs: Doc<Memory>[]) {
	const timeline: Doc<Memory>[] = [], pending: Doc<Memory>[] = [];
	for (const doc of docs) {
		if (isMemoryDate(doc.data.date) && memoryTitle(doc.data.title)) timeline.push(doc);
		else pending.push(doc);
	}
	timeline.sort((a, b) => b.data.date.localeCompare(a.data.date) || (b.data.c ?? 0) - (a.data.c ?? 0));
	return { timeline, pending };
}
