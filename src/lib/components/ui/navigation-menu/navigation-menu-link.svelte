<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.LinkProps = $props();
</script>

<NavigationMenuPrimitive.Link
	bind:ref
	data-slot="navigation-menu-link"
	class={cn("flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring in-data-[slot=navigation-menu-content]:rounded-xl in-data-[slot=navigation-menu-content]:text-foreground", className)}
	{...restProps}
/>
