<script lang="ts" generics="K extends string">
	let {
		options,
		value = $bindable(),
		label = "筛选",
		wrap = false,
	}: { options: Record<K, string>; value: K; label?: string; wrap?: boolean } = $props();
	const keys = $derived(Object.keys(options) as K[]);
	const name = $props.id();
</script>

<fieldset class="min-w-0 border-0 p-0">
	<legend class="sr-only">{label}</legend>
	<div class={['flex gap-2 py-1 md:mx-0 md:flex-wrap md:px-0', wrap ? 'flex-wrap' : '-mx-4 overflow-x-auto px-4']}>
		{#each keys as k (k)}
			<label class="group relative shrink-0 cursor-pointer">
				<input type="radio" {name} value={k} bind:group={value} class="peer sr-only" />
				<span class="inline-flex h-11 items-center rounded-full md:h-9 border border-border px-4 text-sm font-medium transition-colors peer-not-checked:group-hover:bg-muted peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">{options[k]}</span>
			</label>
		{/each}
	</div>
</fieldset>
