import type { Who } from "./types";

export function accountKey(name: string, owner: Who) {
	return `${name}:${owner}`;
}

export function readLocal<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

export function writeLocal(key: string, value: unknown) {
	try {
		if (value === null || value === undefined) localStorage.removeItem(key);
		else localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}
