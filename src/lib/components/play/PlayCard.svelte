<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Card from "$lib/components/ui/card";
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

<Card.Root as="section" {id} aria-labelledby={headingId} class={cn("min-w-0 scroll-mt-36 overflow-visible md:scroll-mt-24", className)}>
	<Card.Header>
		<Card.Title id={headingId} tabindex={-1}>{title}</Card.Title>
		{#if meta}<Card.Description>{meta}</Card.Description>{/if}
	</Card.Header>
	<Card.Content class="flex min-w-0 flex-1 flex-col gap-4">{@render children()}</Card.Content>
</Card.Root>
