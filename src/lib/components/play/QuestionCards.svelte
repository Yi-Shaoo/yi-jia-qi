<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import PlayCard from "./PlayCard.svelte";
	import { QUESTIONS, QUESTION_LEVELS, type QuestionLevel } from "$lib/data/content";
	import { pick } from "$lib/fx";
	import { cn } from "$lib/utils";

	let { id }: { id: string } = $props();
	let level = $state<QuestionLevel>("l1");
	const decks = $state<Partial<Record<QuestionLevel, { question: string; count: number }>>>({});
	const card = $derived(decks[level]);

	function draw() {
		const pool = QUESTIONS[level];
		const choices = pool.length > 1 ? pool.filter((q) => q !== card?.question) : pool;
		decks[level] = { question: pick(choices), count: (card?.count ?? 0) + 1 };
	}
	const TINT: Record<QuestionLevel, string> = {
		l1: "bg-sea-soft",
		l2: "bg-coral-soft",
		l3: "bg-sand",
		l4: "bg-[#ffd6e0] dark:bg-[#4a2533]",
	};
</script>

<PlayCard {id} title="问题卡" meta={`本牌堆 ${QUESTIONS[level].length} 张`}>
	<FilterChips options={QUESTION_LEVELS} bind:value={level} label="牌堆" />
	<div class="relative py-2">
		<div class={cn("absolute inset-x-6 top-4 bottom-0 -rotate-2 rounded-2xl", TINT[level], "opacity-50")}></div>
		<div aria-live="polite" class={cn("relative flex min-h-40 flex-col justify-between gap-4 rounded-2xl p-6", TINT[level])}>
			{#key card}
				<p class={cn("font-display text-xl leading-snug font-bold", card && "animate-pop")}>{card?.question ?? "适合视频时轮流回答。"}</p>
			{/key}
			{#if card}<span class="font-mono text-xs text-muted-foreground">{QUESTION_LEVELS[level]} · 第 {card.count} 张</span>{/if}
		</div>
	</div>
	<Button class="self-start rounded-full" onclick={draw}>抽一张</Button>
</PlayCard>
