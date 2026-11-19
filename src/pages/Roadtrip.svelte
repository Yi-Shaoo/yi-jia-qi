<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import MapButton from "$lib/components/MapButton.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { ROAD, type RouteKind } from "$lib/data/content";

	const FILTERS: Record<"all" | RouteKind, string> = { all: "全部", short: "一日 / 短途", wk: "周末", long: "长假" };
	let kind = $state<"all" | RouteKind>("all");
	const list = $derived(ROAD.filter((r) => kind === "all" || r.kind === kind));
</script>

<PageHeader eyebrow="Road trips" title="Road-trip 路线" lede="车程按从 LA 出发估算，从 Irvine 出发往南的路线会更近。每条附 3 个推荐停靠点。" />

<div class="mb-5"><FilterChips options={FILTERS} bind:value={kind} label="按时长筛选" /></div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	{#each list as r (r.name)}
		<article class="flex flex-col gap-3 rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--border)]">
			<div class="flex flex-wrap gap-1.5">
				<Badge variant="secondary">{r.days}</Badge>
				<Badge variant="outline">{r.drive}</Badge>
				<Badge class="bg-sand text-sand-ink">{r.season}</Badge>
			</div>
			<h3 class="text-xl font-bold">{r.name}</h3>
			<ol class="flex flex-col gap-2">
				{#each r.stops as s, i (i)}
					<li class="flex items-start gap-3 text-[15px]">
						<span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sea-soft font-mono text-xs text-sea">{i + 1}</span>
						{s}
					</li>
				{/each}
			</ol>
			<div class="mt-auto flex flex-wrap gap-2 pt-1">
				<MapButton q={r.q} />
				<WishButton text={`Road-trip：${r.name}`} />
			</div>
		</article>
	{/each}
</div>
