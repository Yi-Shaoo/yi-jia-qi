<script lang="ts">
	import type { Snippet } from "svelte";
	import TravelDetails from "./TravelDetails.svelte";
	import Pencil from "@lucide/svelte/icons/pencil";
	import MapButton from "$lib/components/MapButton.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import type { WishCat } from "$lib/types";

	let { name, meta, desc, q, wish, cat, summary, children, onedit }: {
		name: string; meta: string[]; desc?: string; q: string; wish: string; cat: WishCat;
		summary?: string; children?: Snippet; onedit?: () => void;
	} = $props();
</script>

<article class="surface-card flex min-w-0 flex-col gap-3 p-4 wrap-anywhere sm:p-5">
	<h2 class="text-xl leading-tight font-bold">{name}</h2>
	<div class="flex flex-wrap items-center gap-1.5">
		{#if onedit}<Badge class="bg-coral-soft text-coral">我们加的</Badge>{/if}
		{#each meta.filter(Boolean) as tag, i (i)}<Badge variant={i ? "outline" : "secondary"}>{tag}</Badge>{/each}
	</div>
	{#if desc}<p class="text-sm leading-relaxed text-muted-foreground">{desc}</p>{/if}
	<div class="flex flex-wrap gap-2">
		<MapButton {q} />
		<WishButton text={wish} {cat} />
		{#if onedit}<Button variant="ghost" size="sm" class="rounded-full" onclick={onedit}><Pencil />编辑</Button>{/if}
	</div>
	{#if summary && children}
		<TravelDetails label={summary}><div class="grid gap-3">{@render children()}</div></TravelDetails>
	{/if}
</article>
