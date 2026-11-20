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
	const headingId = $props.id();
</script>

<section {id} aria-labelledby={headingId} class={cn("surface-card flex min-w-0 scroll-mt-36 md:scroll-mt-24 flex-col gap-4 p-5 md:p-6", className)}>
	<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
		<h2 id={headingId} tabindex="-1" class="text-xl font-bold md:text-2xl">{title}</h2>
		{#if meta}<span class="shrink-0 font-mono text-xs text-muted-foreground">{meta}</span>{/if}
	</div>
	{@render children()}
</section>
