<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let {
		title,
		meta = "",
		id,
		class: className,
		children,
	}: { title: string; meta?: string; id?: string; class?: string; children: Snippet } = $props();
</script>

<section {id} class={cn("flex scroll-mt-24 flex-col gap-4 rounded-[24px] bg-card p-5 shadow-[0_0_0_1px_var(--border)] md:p-6", className)}>
	<div class="flex items-baseline justify-between gap-3">
		<h2 class="text-xl font-bold md:text-2xl">{title}</h2>
		{#if meta}<span class="shrink-0 font-mono text-xs text-muted-foreground">{meta}</span>{/if}
	</div>
	{@render children()}
</section>
