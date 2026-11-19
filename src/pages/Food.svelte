<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import PlaceEditor from "$lib/components/places/PlaceEditor.svelte";
	import AddPlaceCard from "$lib/components/places/AddPlaceCard.svelte";
	import MapButton from "$lib/components/MapButton.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { AREA, FOOD } from "$lib/data/content";
	import { useCollection } from "$lib/sync.svelte";
	import type { CustomPlace, Doc } from "$lib/types";
	import Pencil from "@lucide/svelte/icons/pencil";

	type F = "all" | "oc" | "la" | "mid";
	const FILTERS: Record<F, string> = { all: "全部", oc: AREA.oc, la: AREA.la, mid: AREA.mid };
	let area = $state<F>("all");

	const custom = useCollection("custom");
	const mine = $derived(
		custom.docs
			.filter((d) => d.data.kind === "food" && d.data.name && (area === "all" || d.data.area === area))
			.sort((a, b) => (b.data.c ?? 0) - (a.data.c ?? 0)),
	);
	const builtIn = $derived(FOOD.filter((d) => area === "all" || d.area === area));
	const cards = $derived([
		...mine.map((d) => ({ ...d.data, q: d.data.q || d.data.name, price: d.data.price ?? "", doc: d as Doc<CustomPlace> | null })),
		...builtIn.map((d) => ({ ...d, doc: null as Doc<CustomPlace> | null })),
	]);

	let editorOpen = $state(false);
	let editing = $state<Doc<CustomPlace> | null>(null);
	function openEditor(item: Doc<CustomPlace> | null) {
		editing = item;
		editorOpen = true;
	}
</script>

<PageHeader eyebrow="Eat together" title="今天吃什么" lede="都是营业多年的老店。去之前在地图里看一眼营业时间，热门店记得提前订位或早点排队。" />

<div class="mb-5"><FilterChips options={FILTERS} bind:value={area} label="按位置筛选" /></div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	<AddPlaceCard kind="food" onclick={() => openEditor(null)} />
	{#each cards as c (c.doc?.id ?? c.name)}
		<article class={["flex flex-col gap-3 rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--border)]", c.doc && "ring-2 ring-coral/30"]}>
			<div class="flex flex-wrap gap-1.5">
				{#if c.doc}<Badge class="bg-coral-soft text-coral">我们加的</Badge>{/if}
				{#if AREA[c.area as keyof typeof AREA]}<Badge variant="secondary">{AREA[c.area as keyof typeof AREA]}</Badge>{/if}
				{#if c.type}<Badge variant="outline">{c.type}</Badge>{/if}
				{#if c.price}<Badge variant="outline" class="font-mono">{c.price}</Badge>{/if}
			</div>
			<h3 class="text-xl font-bold">{c.name}</h3>
			{#if c.desc}<p class="text-[15px] leading-relaxed text-muted-foreground">{c.desc}</p>{/if}
			{#if c.tip}<p class="rounded-xl bg-sand px-3 py-2 text-[13px] text-sand-ink">💡 {c.tip}</p>{/if}
			<div class="mt-auto flex flex-wrap gap-2 pt-1">
				<MapButton q={c.q} />
				<WishButton text={`去吃 ${c.name}`} />
				{#if c.doc}<Button variant="ghost" size="sm" class="rounded-full" onclick={() => openEditor(c.doc)}><Pencil />编辑</Button>{/if}
			</div>
		</article>
	{/each}
</div>

<PlaceEditor bind:open={editorOpen} kind="food" item={editing} />
