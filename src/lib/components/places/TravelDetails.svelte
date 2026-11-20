<script lang="ts">
	import type { Snippet } from "svelte";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";

	let { label, expanded = false, children }: { label: string; expanded?: boolean; children: Snippet } = $props();
	let open = $derived(expanded);
</script>

<details bind:open class="group border-t">
	<summary class="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold">{label}<ChevronDown aria-hidden="true" class="size-4 group-open:rotate-180" /></summary>
	{#if open}{@render children()}{/if}
</details>
