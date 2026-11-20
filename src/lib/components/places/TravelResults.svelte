<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import EmptyState from "$lib/components/EmptyState.svelte";
	import { Button } from "$lib/components/ui/button";

	import { savedReading, travelHistory } from "./travel-history.svelte";

	let { items, keyOf, children, noun, onreset, ready = true }: {
		ready?: boolean; items: T[]; keyOf: (item: T) => string; children: Snippet<[T]>; noun: string; onreset: () => void;
	} = $props();
	const batch = 9;
	const reading = savedReading();
	let requested = $state(reading?.limit ?? batch);
	const limit = $derived(Math.max(requested, reading ? items.findIndex((item) => keyOf(item) === reading.card) + 1 : 0));

	function loadWhenNear(node: HTMLElement) {
		if (typeof IntersectionObserver === "undefined") {
			requested = items.length;
			return;
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting || !node.isConnected) return;
			observer.disconnect();
			requested = Math.min(limit + batch, items.length);
		}, { rootMargin: "0px 0px 160px" });
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}
</script>

{#if items.length}
	<p role="status" class="mb-3 text-sm text-muted-foreground">{noun} · {Math.min(limit, items.length)} / {items.length}</p>
	<div use:travelHistory={() => ({ ready, limit })} class="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each items.slice(0, limit) as item (keyOf(item))}
			<div class="min-w-0" data-travel-card={keyOf(item)}>{@render children(item)}</div>
		{/each}
	</div>
	{#if limit < items.length}
		{#key limit}
			<div use:loadWhenNear aria-hidden="true" class="h-px"></div>
		{/key}
	{/if}
{:else}
	<EmptyState message={`没有匹配的${noun}`} announce><Button variant="outline" onclick={onreset}>清除筛选</Button></EmptyState>
{/if}
