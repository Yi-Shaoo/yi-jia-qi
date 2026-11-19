<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		eyebrow,
		title,
		lede,
		actions,
	}: { eyebrow: string; title: string; lede?: string; actions?: Snippet } = $props();
</script>

<div class="flex flex-wrap items-end justify-between gap-4 pt-6 pb-6 md:pt-10 md:pb-8">
	<div class="max-w-2xl">
		<span class="eyebrow">{eyebrow}</span>
		<h1 class="mt-2 text-[34px] leading-tight font-bold md:text-[44px]">{title}</h1>
		{#if lede}<p class="mt-2 text-[15px] leading-relaxed text-muted-foreground">{lede}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap gap-2">{@render actions()}</div>{/if}
</div>
