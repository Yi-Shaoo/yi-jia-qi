<script lang="ts">
	import Search from "@lucide/svelte/icons/search";
	import { Input } from "$lib/components/ui/input";

	let { query = $bindable(), label }: { query: string; label: string } = $props();
</script>

<div class="relative w-full sm:max-w-sm">
	<Search aria-hidden="true" class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
	<Input type="search" aria-label={label} placeholder={label} bind:value={query} class="h-11 bg-card pl-10" />
</div>
