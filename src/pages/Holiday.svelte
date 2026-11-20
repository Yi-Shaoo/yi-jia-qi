<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import TravelSearch from "$lib/components/places/TravelSearch.svelte";
	import { matches } from "$lib/components/places/search";
	import { Button } from "$lib/components/ui/button";
	import { THANKS, XMAS } from "$lib/data/content";
	import { dayDiff } from "$lib/dates";
	import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
	import TravelDetails from "$lib/components/places/TravelDetails.svelte";

	import { query as param, replaceQuery } from "$lib/router.svelte";
	import { travelHistory } from "$lib/components/places/travel-history.svelte";

	const query = $derived(param("q") ?? "");
	const holidays = $derived([THANKS, XMAS].map((h) => ({ ...h,
		events: h.events.filter((e) => matches(query, h.title, e.name, e.when, e.desc)),
		ideas: h.ideas.filter((idea) => matches(query, h.title, idea)),
	})).filter((h) => h.events.length || h.ideas.length));
</script>

<PageHeader title="感恩节和圣诞" lede="购票前请核对主办方公布的场次。" />
<div class="mb-5"><TravelSearch bind:query={() => query, (q) => replaceQuery({ q })} label="搜索节日、活动或小计划" /></div>
{#key query.trim()}
<div use:travelHistory class="grid items-start gap-4 lg:grid-cols-2">
	{#each holidays as h (h.date)}
		{@const n = dayDiff(h.date)}
		<section data-travel-card={h.date} class="surface-card min-w-0 p-5 wrap-anywhere">
			<h2 class="text-2xl font-bold">{h.title}</h2>
			<div class="mt-1 mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
				<time datetime={h.date}>{h.date.slice(0, 4)} 年 {h.sub}</time>
				{#if n >= 0}<span class="rounded-full bg-coral-soft px-2 py-0.5 text-xs text-coral">{n ? `还有 ${n} 天` : "就是今天"}</span>{/if}
			</div>
			{#if h.events.length}
				<TravelDetails expanded={!!query.trim()} label={`南加州活动 · ${h.events.length}`}>
					<ul class="divide-y">
						{#each h.events as e (e.name)}
							<li class="grid justify-items-start gap-2 py-3">
								<span class="font-mono text-xs text-muted-foreground">{e.when}</span>
								<a href={e.url} target="_blank" rel="noopener external" class="font-semibold text-sea underline decoration-sea/40 underline-offset-4">{e.name}<ArrowUpRight class="ml-0.5 inline size-3.5" /></a>
								<p class="text-sm text-muted-foreground">{e.desc}</p>
								<WishButton text={`${h.title}：${e.name}`} cat="place" />
							</li>
						{/each}
					</ul>
				</TravelDetails>
			{/if}
			{#if h.ideas.length}
				<TravelDetails expanded={!!query.trim()} label={`两个人的小计划 · ${h.ideas.length}`}>
					<ul class="divide-y">
						{#each h.ideas as idea (idea)}
							<li class="flex items-center justify-between gap-3 py-3 text-sm">{idea}<WishButton text={`${h.title}：${idea}`} cat="place" /></li>
						{/each}
					</ul>
				</TravelDetails>
			{/if}
		</section>
	{:else}
		<div><p role="status" class="mb-3 text-sm text-muted-foreground">没有匹配的活动或小计划</p><Button variant="outline" onclick={() => replaceQuery({ q: null })}>清除筛选</Button></div>
	{/each}
</div>
{/key}
