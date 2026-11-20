<script lang="ts" generics="K extends string">
	import { RadioChoice } from "$lib/components/ui/radio-choice";

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
			<RadioChoice {name} value={k} label={options[k]} bind:selected={value} />
		{/each}
	</div>
</fieldset>
