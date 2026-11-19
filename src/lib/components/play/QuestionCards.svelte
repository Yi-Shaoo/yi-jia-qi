<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import PlayCard from "./PlayCard.svelte";
	import { QUESTIONS, QUESTION_LEVELS, type QuestionLevel } from "$lib/data/content";
	import { pick } from "$lib/fx";
	import { cn } from "$lib/utils";

	/** 问题卡：视频的时候一起抽，被抽到的人先回答 */
	let level = $state<QuestionLevel>("l1");
	let n = $state(0);
	let q = $state("");
	let flip = $state(false);
	const last: Partial<Record<QuestionLevel, string>> = {};

	function draw() {
		const pool = QUESTIONS[level];
		let next = pick(pool);
		while (pool.length > 1 && next === last[level]) next = pick(pool);
		last[level] = next;
		q = next;
		n++;
		flip = false;
		requestAnimationFrame(() => (flip = true));
	}
	const TINT: Record<QuestionLevel, string> = {
		l1: "bg-sea-soft",
		l2: "bg-coral-soft",
		l3: "bg-sand",
		l4: "bg-[#ffd6e0] dark:bg-[#4a2533]",
	};
</script>

<PlayCard title="问题卡" meta={`${QUESTIONS[level].length} 张`}>
	<FilterChips options={QUESTION_LEVELS} bind:value={level} label="牌堆" />
	<div class="relative py-2">
		<div class={cn("absolute inset-x-6 top-4 bottom-0 -rotate-2 rounded-2xl", TINT[level], "opacity-50")}></div>
		<div class={cn("relative flex min-h-40 flex-col justify-between gap-4 rounded-2xl p-6", TINT[level], flip && "animate-pop")}>
			<p class="font-display text-xl leading-snug font-bold">{q || "点“抽一张”，被抽到的人先回答"}</p>
			<span class="font-mono text-xs text-muted-foreground">{QUESTION_LEVELS[level]}{n ? ` · 第 ${n} 张` : ""}</span>
		</div>
	</div>
	<Button class="self-start rounded-full" onclick={draw}>抽一张</Button>
</PlayCard>
