export function filterKey<K extends string>(value: string | null, options: Partial<Record<K, string>>): K | "all" {
	return value && Object.hasOwn(options, value) ? value as K : "all";
}

export function matches(query: string, ...fields: string[]) {
	const text = fields.join(" ").toLowerCase();
	return query.trim().toLowerCase().split(/\s+/).every((word) => text.includes(word));
}
