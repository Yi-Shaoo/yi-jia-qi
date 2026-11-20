import { tick } from "svelte";
import { session } from "$lib/session.svelte";
import { useCollection } from "$lib/sync.svelte";

type Reading = {
	url: string; who: string; card: string; href: string; top: number; limit: number; open: [string, number][];
};

const cards = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("[data-travel-card]"));
const details = (card: HTMLElement) => Array.from(card.querySelectorAll<HTMLDetailsElement>("details"));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export function savedReading(): Reading | undefined {
	const saved: Reading | undefined = history.state?.travelReading;
	return saved && saved.url === location.href && saved.who === session.who ? saved : undefined;
}

async function restore(root: HTMLElement, saved: Reading, signal: AbortSignal) {
	const active = () => !signal.aborted && root.isConnected && saved.url === location.href;
	await nextFrame();
	if (!active()) return;
	const list = cards(root), source = list.find((el) => el.dataset.travelCard === saved.card);
	if (!source) return;
	const toggles: Promise<void>[] = [];
	for (const card of list) details(card).forEach((detail, i) => {
		const open = saved.open.some(([key, n]) => key === card.dataset.travelCard && n === i);
		if (detail.open !== open) {
			toggles.push(new Promise((resolve) => detail.addEventListener("toggle", () => resolve(), { once: true })));
			detail.open = open;
		}
	});
	await Promise.all(toggles);
	await tick();
	if (!active()) return;
	const link = source.querySelector<HTMLAnchorElement>(`a[href=${CSS.escape(saved.href)}]`);
	if (!link) return;
	const align = () => window.scrollBy({ top: link.getBoundingClientRect().top - saved.top, behavior: "instant" });
	link.focus({ preventScroll: true });
	align();
	if (document.fonts.status === "loading") {
		await document.fonts.ready;
		if (active() && link === document.activeElement) align();
	}
}

export function travelHistory(root: HTMLElement, options: () => { limit?: number; ready?: boolean } = () => ({})) {
	const saved = savedReading();
	function remember(event: MouseEvent) {
		if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
		const link = (event.target as Element)?.closest<HTMLAnchorElement>('a[href^="/wish?item="]');
		const card = link?.closest<HTMLElement>("[data-travel-card]")?.dataset.travelCard;
		if (!link || !card || link.target || !session.who) return;
		const reading: Reading = {
			url: location.href, who: session.who, card, href: link.getAttribute("href")!, top: link.getBoundingClientRect().top,
			limit: options().limit ?? 9,
			open: cards(root).flatMap((el) => details(el).flatMap((d, i): [string, number][] => d.open ? [[el.dataset.travelCard!, i]] : [])),
		};
		history.replaceState({ ...history.state, travelReading: reading }, "");
	}
	root.addEventListener("click", remember);
	const abort = new AbortController();
	if (saved) {
		const wishes = useCollection("wishes");
		for (const event of ["pointerdown", "keydown", "wheel", "touchstart"]) {
			window.addEventListener(event, () => abort.abort(), { passive: true, capture: true, signal: abort.signal });
		}
		let started = false;
		$effect(() => {
			if (started || abort.signal.aborted || options().ready === false || !wishes.ready) return;
			started = true;
			void restore(root, saved, abort.signal).finally(() => abort.abort());
		});
	}
	return { destroy() { abort.abort(); root.removeEventListener("click", remember); } };
}
