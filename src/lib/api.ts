import type { Who } from "./types";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public retryAfter?: number,
	) {
		super(message);
	}
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) headers.set("content-type", "application/json");
	const res = await fetch(`/api${path}`, {
		credentials: "same-origin",
		...init,
		headers,
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok) {
		const wait = Number(res.headers.get("retry-after"));
		throw new ApiError(res.status, (body as { error?: string }).error ?? "出错了", Number.isFinite(wait) && wait > 0 ? wait : undefined);
	}
	return body as T;
}

let active: { who: Who; controller: AbortController } | null = null;

export function setApiAccount(who: Who | null) {
	active?.controller.abort();
	active = who ? { who, controller: new AbortController() } : null;
}

export function accountApi(): typeof api {
	const scope = active;
	return async <T>(path: string, init: RequestInit = {}) => {
		if (!scope || scope !== active) throw new ApiError(412, "登录账号已变更");
		const { signal } = scope.controller;
		const headers = new Headers(init.headers);
		headers.set("x-yjq-account", scope.who);
		try {
			const result = await api<T>(path, { ...init, headers, signal });
			signal.throwIfAborted();
			return result;
		} catch (error) {
			if (!signal.aborted && error instanceof ApiError && [401, 412].includes(error.status)) {
				window.dispatchEvent(new Event("yjq:session-changed"));
			}
			throw error;
		}
	};
}

export const fileUrl = (id: string) => `/files/${id}`;
