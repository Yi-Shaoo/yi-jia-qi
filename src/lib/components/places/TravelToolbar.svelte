<script lang="ts">
	import type { Snippet } from "svelte";
	import TravelSearch from "./TravelSearch.svelte";

	let { query = $bindable(), scope, children }: { query: string; scope: string; children?: Snippet } = $props();
</script>

<div role="search" aria-label={`搜索${scope}`} class={['mb-5 grid min-w-0 items-center gap-x-6 gap-y-2 [--chip-min-height:2.75rem]', children ? 'lg:grid-cols-[minmax(14rem,1fr)_auto]' : 'max-w-lg']}>
	<TravelSearch bind:query {scope} />
	{@render children?.()}
</div>
