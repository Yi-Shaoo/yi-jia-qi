<script lang="ts">
	import { thumbnail } from "$lib/thumbnail";
	import { cn } from "$lib/utils";

	let {
		src,
		id,
		alt = "",
		stamp = "",
		title = "",
		sub = "",
		tilt = 0,
		imgClass = "h-[220px]",
		class: className,
		"aria-label": label,
		onclick,
	}: {
		src: string;
		id?: string;
		alt?: string;
		stamp?: string;
		title?: string;
		sub?: string;
		tilt?: number;
		imgClass?: string;
		class?: string;
		"aria-label"?: string;
		onclick?: () => void;
	} = $props();

	const cls = $derived(cn("polaroid relative m-0 block w-full min-w-0 text-left transition-transform hover:-translate-y-0.5", className));
	const tf = $derived(tilt ? `rotate(${tilt}deg)` : undefined);
</script>

{#snippet inner()}
	<span class="relative block">
		<img use:thumbnail {src} {alt} loading="lazy" class={cn("block w-full bg-[#eee9df] object-scale-down", imgClass)} />
		{#if stamp}<span class="film-stamp absolute right-2 bottom-2 text-[15px]">{stamp}</span>{/if}
	</span>
	{#if title}<b class="mt-3 line-clamp-2 font-display text-[17px] leading-snug font-bold wrap-anywhere">{title}</b>{/if}
	{#if sub}<span class="line-clamp-2 text-[13px] wrap-anywhere text-[#5b6779]">{sub}</span>{/if}
{/snippet}

{#if onclick}
	<button {id} type="button" {onclick} class={cls} style:transform={tf} aria-label={label || alt || title || "看大图"}>{@render inner()}</button>
{:else}
	<figure class={cls} style:transform={tf}>{@render inner()}</figure>
{/if}
