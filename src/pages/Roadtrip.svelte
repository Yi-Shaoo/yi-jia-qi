<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import TravelCard from "$lib/components/places/TravelCard.svelte";
	import TravelToolbar from "$lib/components/places/TravelToolbar.svelte";
	import TravelResults from "$lib/components/places/TravelResults.svelte";
	import { filterKey, matches } from "$lib/components/places/search";
	import { query as param, replaceQuery } from "$lib/router.svelte";
	import { ROAD, type RouteKind } from "$lib/data/content";

	const FILTERS: Record<"all" | RouteKind, string> = { all: "全部", short: "一日 / 短途", wk: "周末", long: "长假" };
	const kind = $derived(filterKey(param("kind"), FILTERS));
	const query = $derived(param("q") ?? "");
	const list = $derived(ROAD.filter((r) => (kind === "all" || r.kind === kind) && matches(query, r.name, FILTERS[r.kind], r.days, r.drive, r.season, r.q, ...r.stops)));
</script>

<PageHeader title="Road-trip 路线" lede="车程从 LA 估算；从 Irvine 往南更近。" />
<TravelToolbar bind:query={() => query, (q) => replaceQuery({ q })} scope="路线、季节或沿途站点">
	<FilterChips wrap options={FILTERS} bind:value={() => kind, (v) => replaceQuery({ kind: v === "all" ? null : v })} label="按时长筛选" />
</TravelToolbar>
{#key `${kind}:${query.trim()}`}
	<TravelResults items={list} keyOf={(r) => r.name} noun="路线" onreset={() => replaceQuery({ q: null, kind: null })}>
		{#snippet children(r)}
			<TravelCard name={r.name} meta={[r.days, r.drive, r.season]} q={r.q} wish={`Road-trip：${r.name}`} cat="place" summary={`沿途 ${r.stops.length} 站`}>
				<ol class="grid list-decimal gap-2 pl-5 text-sm marker:text-muted-foreground">
					{#each r.stops as stop (stop)}<li>{stop}</li>{/each}
				</ol>
			</TravelCard>
		{/snippet}
	</TravelResults>
{/key}
