<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.ViewportProps = $props();
</script>

<div
	class={cn(
		"absolute start-0 top-full isolate z-50 flex justify-center"
	)}
>
	<NavigationMenuPrimitive.Viewport
		bind:ref
		data-slot="navigation-menu-viewport"
		class={cn(
			"bg-popover text-popover-foreground ring-border rounded-xl shadow-md ring-1 origin-top-center relative mt-1.5 w-full overflow-hidden",
			"h-[calc(var(--bits-navigation-menu-viewport-height)_+_1rem)] md:w-[calc(var(--bits-navigation-menu-viewport-width)_+_1rem)]",
			className
		)}
		{...restProps}
	/>
</div>
