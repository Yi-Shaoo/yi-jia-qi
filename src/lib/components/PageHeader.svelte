<script lang="ts">
	import type { Snippet } from "svelte";

	let { id, title, lede, actions, stackActions = false }: {
		id?: string; title: string; lede?: string; actions?: Snippet; stackActions?: boolean;
	} = $props();
</script>

<div class="mb-5 flex min-w-0 flex-wrap items-end justify-between gap-3 border-b py-5 md:mb-6 md:gap-6 md:pt-8">
	<div class="min-w-0 max-w-2xl">
		<h1 {id} class="font-display text-[34px] leading-tight font-bold wrap-anywhere md:text-[44px]">{title}</h1>
		{#if lede}<p class="mt-2 text-[15px] leading-relaxed text-pretty text-muted-foreground">{lede}</p>{/if}
	</div>
	{#if actions}<div class={['flex min-w-0 flex-wrap items-center gap-2', stackActions && 'basis-full md:basis-auto']}>{@render actions()}</div>{/if}
</div>
