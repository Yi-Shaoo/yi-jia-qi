<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";

	let { query = $bindable(), scope }: { query: string; scope: string } = $props();
	const id = $props.id();
</script>

<div class="flex min-w-0 items-center gap-3">
	<Label for={id} class="shrink-0">搜索<span class="sr-only">{scope}</span></Label>
	<Input {id} type="search" placeholder={scope} bind:value={query} class="flex-1 bg-card" />
</div>
