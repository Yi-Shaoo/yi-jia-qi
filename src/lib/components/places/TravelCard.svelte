<script lang="ts">
	import type { Snippet } from "svelte";
	import TravelDetails from "./TravelDetails.svelte";
	import Pencil from "@lucide/svelte/icons/pencil";
	import MapButton from "$lib/components/MapButton.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import * as Card from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import type { WishCat } from "$lib/types";

	let { name, meta, desc, q, wish, cat, summary, children, onedit }: {
		name: string; meta: string[]; desc?: string; q: string; wish: string; cat: WishCat;
		summary?: string; children?: Snippet; onedit?: () => void;
	} = $props();
</script>

<Card.Root as="article" size="sm" class="min-w-0 overflow-visible wrap-anywhere">
	<Card.Header>
		<Card.Title>{name}</Card.Title>
		<div class="flex flex-wrap items-center gap-1.5">
			{#if onedit}<Badge variant="secondary">我们加的</Badge>{/if}
			{#each meta.filter(Boolean) as tag, i (i)}<Badge variant={i ? "outline" : "secondary"}>{tag}</Badge>{/each}
		</div>
		{#if desc}<Card.Description>{desc}</Card.Description>{/if}
	</Card.Header>
	<Card.Footer class="flex-wrap gap-2">
		<MapButton {q} />
		<WishButton text={wish} {cat} />
		{#if onedit}<Button variant="ghost" size="sm" class="rounded-full" onclick={onedit}><Pencil />编辑</Button>{/if}
	</Card.Footer>
	{#if summary && children}
		<Card.Content><TravelDetails label={summary}><div class="grid gap-3">{@render children()}</div></TravelDetails></Card.Content>
	{/if}
</Card.Root>
