/** localStorage 读写（隐私模式下可能不可用，所以都包在 try 里）。只存草稿这类本机小东西。 */

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
