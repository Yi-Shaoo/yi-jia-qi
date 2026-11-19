import type { Doc } from "./db";

/** 推给浏览器的实时变更 */
export type ChangeEvent =
	| { col: string; op: "put"; doc: Doc; by: string }
	| { col: string; op: "delete"; id: string; by: string };

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const enc = new TextEncoder();

function send(c: ReadableStreamDefaultController<Uint8Array>, chunk: string) {
	try {
		c.enqueue(enc.encode(chunk));
	} catch {
		clients.delete(c);
	}
}

export function broadcast(ev: ChangeEvent) {
	const chunk = `data: ${JSON.stringify(ev)}\n\n`;
	for (const c of clients) send(c, chunk);
}

// 每 20 秒发一次心跳，防止反向代理把连接断掉
setInterval(() => {
	for (const c of clients) send(c, `: ping ${Date.now()}\n\n`);
}, 20_000);

export function subscribe(req: Request): Response {
	let ctl: ReadableStreamDefaultController<Uint8Array>;
	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			ctl = c;
			clients.add(c);
			send(c, `retry: 3000\nevent: ready\ndata: {}\n\n`);
		},
		cancel() {
			clients.delete(ctl);
		},
	});
	req.signal.addEventListener("abort", () => {
		clients.delete(ctl);
		try {
			ctl.close();
		} catch {}
	});
	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-store",
			connection: "keep-alive",
			"x-accel-buffering": "no",
		},
	});
}
