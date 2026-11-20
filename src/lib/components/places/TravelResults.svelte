<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button";

	import { savedReading, travelHistory } from "./travel-history.svelte";

	let { items, keyOf, children, noun, onreset, ready = true }: {
		ready?: boolean; items: T[]; keyOf: (item: T) => string; children: Snippet<[T]>; noun: string; onreset: () => void;
	} = $props();
	const batch = 9;
	const reading = savedReading();
	let requested = $state(reading?.limit ?? batch);
	const limit = $derived(Math.max(requested, reading ? items.findIndex((item) => keyOf(item) === reading.card) + 1 : 0));
</script>

<p role="status" class="mb-3 text-sm text-muted-foreground">{items.length ? `${noun} · ${Math.min(limit, items.length)} / ${items.length}` : `没有匹配的${noun}`}</p>
{#if items.length}
	<div use:travelHistory={() => ({ ready, limit })} class="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each items.slice(0, limit) as item (keyOf(item))}
			<div class="min-w-0" data-travel-card={keyOf(item)}>{@render children(item)}</div>
		{/each}
	</div>
	{#if limit < items.length}
		<div class="mt-5 text-center"><Button variant="outline" onclick={() => requested = limit + batch}>加载更多{noun}</Button></div>
	{/if}
{:else}
	<Button variant="outline" onclick={onreset}>清除筛选</Button>
{/if}
