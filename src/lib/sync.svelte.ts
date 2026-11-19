import { api } from "./api";
import type { CollectionName, Collections, Doc } from "./types";

type ChangeEvent =
	| { col: string; op: "put"; doc: Doc<unknown>; by: string }
	| { col: string; op: "delete"; id: string; by: string };

/**
 * 一个集合的本地副本。读 `docs` 拿到全部数据；增删改先改本地（马上看到效果），
 * 再发给服务器；另一个人的修改通过 SSE 实时推过来。
 */
export class Collection<T> {
	docs = $state<Doc<T>[]>([]);
	status = $state<"loading" | "ready" | "error">("loading");
	#loading: Promise<void> | null = null;

	constructor(public readonly name: CollectionName) {}

	load(): Promise<void> {
		this.#loading ??= api<{ docs: Doc<T>[] }>(`/c/${this.name}`)
			.then((r) => {
				this.docs = r.docs;
				this.status = "ready";
			})
			.catch((e) => {
				this.status = "error";
				throw e;
			})
			.finally(() => {
				this.#loading = null;
			});
		return this.#loading;
	}

	get ready() {
		return this.status === "ready";
	}

	get(id: string): Doc<T> | undefined {
		return this.docs.find((d) => d.id === id);
	}

	/** 内部：把一条文档放进本地列表（新增或替换） */
	put(doc: Doc<T>) {
		const i = this.docs.findIndex((d) => d.id === doc.id);
		if (i < 0) this.docs = [...this.docs, doc];
		else if (this.docs[i].updated <= doc.updated) {
			const next = this.docs.slice();
			next[i] = doc;
			this.docs = next;
		}
	}

	drop(id: string) {
		this.docs = this.docs.filter((d) => d.id !== id);
	}

	async add(data: T): Promise<Doc<T>> {
		const doc = await api<Doc<T>>(`/c/${this.name}`, { method: "POST", body: JSON.stringify(data) });
		this.put(doc);
		return doc;
	}

	async set(id: string, data: T): Promise<Doc<T>> {
		const prev = this.get(id);
		this.put({ id, data, updated: Date.now() });
		try {
			const doc = await api<Doc<T>>(`/c/${this.name}/${id}`, { method: "PUT", body: JSON.stringify(data) });
			this.put(doc);
			return doc;
		} catch (e) {
			if (prev) this.put({ ...prev, updated: Date.now() });
			else this.drop(id);
			throw e;
		}
	}

	async update(id: string, patch: Partial<T>): Promise<Doc<T>> {
		const prev = this.get(id);
		if (prev) this.put({ id, data: { ...prev.data, ...patch }, updated: Date.now() });
		try {
			const doc = await api<Doc<T>>(`/c/${this.name}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
			this.put(doc);
			return doc;
		} catch (e) {
			if (prev) this.put({ ...prev, updated: Date.now() });
			throw e;
		}
	}

	async remove(id: string): Promise<void> {
		const prev = this.get(id);
		this.drop(id);
		try {
			await api(`/c/${this.name}/${id}`, { method: "DELETE" });
		} catch (e) {
			if (prev) this.put(prev);
			throw e;
		}
	}
}

const registry = new Map<string, Collection<unknown>>();

/** 拿到某个集合（第一次用时自动从服务器加载） */
export function useCollection<K extends CollectionName>(name: K): Collection<Collections[K]> {
	let c = registry.get(name) as Collection<Collections[K]> | undefined;
	if (!c) {
		c = new Collection<Collections[K]>(name);
		registry.set(name, c as Collection<unknown>);
		c.load().catch(() => {});
	}
	return c;
}

export const syncState = $state({ connected: false });

let source: EventSource | null = null;
let everConnected = false;

/** 登录后调用：打开实时通道。断线重连后重新拉一遍数据，保证不漏改动。 */
export function startSync() {
	if (source) return;
	source = new EventSource("/api/events");
	source.addEventListener("ready", () => {
		syncState.connected = true;
		if (everConnected) for (const c of registry.values()) c.load().catch(() => {});
		everConnected = true;
	});
	source.onerror = () => {
		syncState.connected = false;
	};
	source.onmessage = (e) => {
		let ev: ChangeEvent;
		try {
			ev = JSON.parse(e.data);
		} catch {
			return;
		}
		const c = registry.get(ev.col);
		if (!c) return;
		if (ev.op === "put") c.put(ev.doc);
		else c.drop(ev.id);
	};
}

export function stopSync() {
	source?.close();
	source = null;
	syncState.connected = false;
	everConnected = false;
	registry.clear();
}
