<script lang="ts">
	import { cn } from "$lib/utils";

	let {
		src,
		alt = "",
		stamp = "",
		title = "",
		sub = "",
		tilt = 0,
		imgClass = "h-[220px]",
		class: className,
		onclick,
	}: {
		src: string;
		alt?: string;
		stamp?: string;
		title?: string;
		sub?: string;
		tilt?: number;
		imgClass?: string;
		class?: string;
		onclick?: () => void;
	} = $props();

	const cls = $derived(cn("polaroid relative m-0 block w-full text-left transition-transform hover:-translate-y-0.5", className));
	const tf = $derived(tilt ? `rotate(${tilt}deg)` : undefined);
</script>

{#snippet inner()}
	<span class="relative block">
		<img {src} {alt} loading="lazy" class={cn("block w-full object-cover", imgClass)} />
		{#if stamp}<span class="film-stamp absolute right-2 bottom-2 text-[15px]">{stamp}</span>{/if}
	</span>
	{#if title}<b class="mt-3 block font-display text-[17px] font-bold">{title}</b>{/if}
	{#if sub}<span class="line-clamp-2 block text-[13px] text-[#5b6779]">{sub}</span>{/if}
{/snippet}

{#if onclick}
	<button type="button" {onclick} class={cls} style:transform={tf} aria-label={alt || title || "看大图"}>{@render inner()}</button>
{:else}
	<figure class={cls} style:transform={tf}>{@render inner()}</figure>
{/if}
