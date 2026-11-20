<script lang="ts">
	import type { Snippet } from "svelte";
	import type { Who } from "$lib/types";

	let { who, as = "article", labelledby, children, class: className }: {
		who: Who; as?: "article" | "section"; labelledby?: string; children: Snippet; class?: string;
	} = $props();
</script>

<svelte:element this={as} data-who={who} aria-labelledby={labelledby} class={["paper-card flex min-w-0 flex-col items-start gap-3 p-4 wrap-anywhere", className]}>
	{@render children()}
</svelte:element>

<style>
	.paper-card {
		color: var(--paper-ink);
		border: 1px solid var(--paper-edge);
		border-top: 4px solid var(--trim);
		border-radius: 6px 7px 9px 7px;
		background: repeating-linear-gradient(transparent 0 27px, var(--paper-rule) 27px 28px) 0 7px / 100% 28px, var(--paper);
		box-shadow: 0 2px 0 var(--paper-edge);
	}
</style>
