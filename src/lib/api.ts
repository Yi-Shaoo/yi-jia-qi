export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`/api${path}`, {
		credentials: "same-origin",
		...init,
		headers:
			init.body && !(init.body instanceof FormData)
				? { "content-type": "application/json", ...init.headers }
				: init.headers,
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok) {
		if (res.status === 401) window.dispatchEvent(new CustomEvent("yjq:unauthorized"));
		throw new ApiError(res.status, (body as { error?: string }).error ?? "出错了");
	}
	return body as T;
}

export const fileUrl = (id: string) => `/files/${id}`;
