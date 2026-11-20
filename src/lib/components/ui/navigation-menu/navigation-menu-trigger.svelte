<script lang="ts" module>
	import { tv } from "tailwind-variants";
	import { cn } from "$lib/utils.js";

	export const navigationMenuTriggerStyle = tv({
		base: "inline-flex h-11 w-max items-center justify-center rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted data-open:bg-secondary data-open:text-secondary-foreground data-[current=true]:bg-secondary data-[current=true]:text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
	});
</script>

<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: NavigationMenuPrimitive.TriggerProps = $props();
</script>

<NavigationMenuPrimitive.Trigger
	bind:ref
	data-slot="navigation-menu-trigger"
	class={cn(navigationMenuTriggerStyle(), className)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="ml-1 size-3" aria-hidden="true" />
</NavigationMenuPrimitive.Trigger>
