<script lang="ts" module>
	export const cardSurface = "rounded-xl bg-card text-card-foreground ring-1 ring-border";
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		as = "div",
		variant = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement> & {
		size?: "default" | "sm"; variant?: "default" | "surface"; as?: "div" | "section" | "article" | "p";
	} = $props();
</script>

<svelte:element this={as} bind:this={ref} data-slot="card" data-size={size} class={cn(cardSurface, "group/card", variant === "default" && "flex flex-col gap-(--card-spacing) overflow-hidden py-(--card-spacing) text-sm [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl", className)} {...restProps}>
	{@render children?.()}
</svelte:element>
