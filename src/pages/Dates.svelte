<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import SpotCard from "$lib/components/places/SpotCard.svelte";
	import PlaceEditor from "$lib/components/places/PlaceEditor.svelte";
	import AddPlaceCard from "$lib/components/places/AddPlaceCard.svelte";
	import { AREA, DATES } from "$lib/data/content";
	import { useCollection } from "$lib/sync.svelte";
	import type { CustomPlace, Doc } from "$lib/types";

	const custom = useCollection("custom");
	let area = $state<keyof typeof AREA>("all");

	const mine = $derived(
		custom.docs
			.filter((d) => d.data.kind === "date" && d.data.name && (area === "all" || d.data.area === area))
			.sort((a, b) => (b.data.c ?? 0) - (a.data.c ?? 0)),
	);
	const builtIn = $derived(DATES.filter((d) => area === "all" || d.area === area));

	let editorOpen = $state(false);
	let editing = $state<Doc<CustomPlace> | null>(null);
	function openEditor(item: Doc<CustomPlace> | null) {
		editing = item;
		editorOpen = true;
	}
</script>

<PageHeader
	eyebrow="Date spots"
	title="约会去哪"
	lede="按位置筛选。“中间点”在 Long Beach 和 Palos Verdes 一带，两边开车都差不多，适合约在半路见面。点空着的拍立得可以放你们自己的照片，攻略做完一步就打个勾。"
/>

<div class="mb-5"><FilterChips options={AREA} bind:value={area} label="按位置筛选" /></div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	<AddPlaceCard kind="date" onclick={() => openEditor(null)} />
	{#each mine as c (c.id)}
		<SpotCard {...c.data} q={c.data.q || c.data.name} mine onedit={() => openEditor(c)} />
	{/each}
	{#each builtIn as d (d.name)}
		<SpotCard {...d} />
	{/each}
</div>

<PlaceEditor bind:open={editorOpen} kind="date" item={editing} />
