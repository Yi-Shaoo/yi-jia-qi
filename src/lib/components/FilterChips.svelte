<script lang="ts" generics="K extends string">
	import { cn } from "$lib/utils";

	let {
		options,
		value = $bindable(),
		label = "筛选",
	}: { options: Record<K, string>; value: K; label?: string } = $props();
	const keys = $derived(Object.keys(options) as K[]);
</script>

<div role="radiogroup" aria-label={label} class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
	{#each keys as k (k)}
		<button
			type="button"
			role="radio"
			aria-checked={value === k}
			onclick={() => (value = k)}
			class={cn(
				"h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
				value === k
					? "border-foreground bg-foreground text-background"
					: "border-border bg-card text-foreground hover:bg-muted",
			)}
		>
			{options[k]}
		</button>
	{/each}
</div>
