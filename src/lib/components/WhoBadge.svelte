<script lang="ts">
	import { cn } from "$lib/utils";
	import type { Who } from "$lib/types";

	let { who, size = "md", class: className }: { who: Who; size?: "sm" | "md" | "lg"; class?: string } = $props();
</script>

<span
	class={cn(
		"inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold",
		who === "yi" ? "bg-yi-soft text-yi" : "bg-jq-soft text-jq",
		size === "sm" && "size-6 text-[10px]",
		size === "md" && "size-9 text-xs",
		size === "lg" && "size-11 text-sm",
		className,
	)}
	aria-hidden="true"
>
	{who === "yi" ? "Yi" : "JQ"}
</span>
