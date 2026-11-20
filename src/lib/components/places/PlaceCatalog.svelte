<script lang="ts">
	import type { Snippet } from "svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import { AREA, DATES, FOOD, type Area } from "$lib/data/content";
	import { useCollection } from "$lib/sync.svelte";
	import type { CustomPlace, Doc } from "$lib/types";
	import AddPlaceButton from "./AddPlaceButton.svelte";
	import PlaceEditor from "./PlaceEditor.svelte";
	import SpotCard from "./SpotCard.svelte";
	import TravelCard from "./TravelCard.svelte";
	import TravelSearch from "./TravelSearch.svelte";
	import TravelResults from "./TravelResults.svelte";
	import { filterKey, matches } from "./search";
	import { query as param, replaceQuery } from "$lib/router.svelte";

	let { kind, title, lede, spotsNotice, spotsSettled = true }: { kind: "date" | "food"; title: string; lede: string; spotsNotice?: Snippet; spotsSettled?: boolean } = $props();
	const custom = useCollection("custom");
	const noun = $derived(kind === "date" ? "地点" : "餐厅");
	const foodAreas = { all: AREA.all, oc: AREA.oc, la: AREA.la, mid: AREA.mid };
	const areas: Record<string, string> = $derived(kind === "date" ? AREA : foodAreas);
	const area = $derived(filterKey<Area | "all">(param("area"), areas));
	const query = $derived(param("q") ?? "");
	type Card = { data: Omit<CustomPlace, "kind" | "c">; doc: Doc<CustomPlace> | null; key: string };
	const catalog: Card[] = $derived([
		...custom.docs.filter((d) => d.data.kind === kind && d.data.name)
			.sort((a, b) => (b.data.c ?? 0) - (a.data.c ?? 0)).map((doc) => ({ data: doc.data, doc, key: `custom:${doc.id}` })),
		...(kind === "date" ? DATES : FOOD).map((data) => ({ data, doc: null, key: `catalog:${data.name}` })),
	]);
	const cards = $derived(catalog.filter(({ data: d }) => (area === "all" || d.area === area) && matches(query, d.name, AREA[d.area as Area], d.type, d.desc, d.tip, d.q, d.price ?? "")));
	let editorOpen = $state(false);
	let editing = $state<Doc<CustomPlace> | null>(null);
	function openEditor(item: Doc<CustomPlace> | null) {
		editing = item;
		editorOpen = true;
	}
	function reset() { replaceQuery({ q: null, area: null }); }
</script>

<PageHeader {title} {lede} stackActions>
	{#snippet actions()}<AddPlaceButton {kind} onclick={() => openEditor(null)} />{/snippet}
</PageHeader>
<div class="mb-4 grid gap-3">
	<TravelSearch bind:query={() => query, (q) => replaceQuery({ q })} label={`搜索${noun}、地区或类型`} />
	<FilterChips wrap options={areas} bind:value={() => area, (v) => replaceQuery({ area: v === "all" ? null : v })} label="按位置筛选" />
</div>
<CollectionNotice status={custom.status} retry={() => custom.load()} label={`自建${noun}`} />
{@render spotsNotice?.()}
{#key `${area}:${query.trim()}`}
	<TravelResults ready={custom.status !== "loading" && spotsSettled} items={cards} keyOf={(c) => c.key} {noun} onreset={reset}>
		{#snippet children({ data: d, doc })}
			{@const q = d.q || d.name}
			{@const onedit = doc ? () => openEditor(doc) : undefined}
			{#if kind === "date"}
				<SpotCard {...d} {q} {onedit} />
			{:else}
				<TravelCard name={d.name} meta={[AREA[d.area as Area], d.type, d.price ?? ""]} desc={d.desc} {q} wish={`去吃 ${d.name}`} cat="food" {onedit} summary={d.tip ? "用餐贴士" : undefined}>
					<p class="text-sm text-muted-foreground">{d.tip}</p>
				</TravelCard>
			{/if}
		{/snippet}
	</TravelResults>
{/key}
<PlaceEditor bind:open={editorOpen} {kind} item={editing} initialArea={area} onsaved={() => replaceQuery({ q: null })} />
