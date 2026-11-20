<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let { as = "h2", ref = $bindable(null), class: className, children, ...restProps }:
		WithElementRef<HTMLAttributes<HTMLElement>> & { as?: "h2" | "h3" | "div" } = $props();
</script>

<svelte:element this={as} bind:this={ref} data-slot="card-title" class={cn("min-w-0 font-display text-xl leading-tight font-bold wrap-anywhere", className)} {...restProps}>
	{@render children?.()}
</svelte:element>
