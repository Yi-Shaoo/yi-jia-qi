<script lang="ts">
	import { Button } from "$lib/components/ui/button";
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
		compact = false,
		liftLandscape = false,
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
		compact?: boolean;
		liftLandscape?: boolean;
		imgClass?: string;
		class?: string;
		"aria-label"?: string;
		onclick?: () => void;
	} = $props();

	const cls = $derived(cn("polaroid relative m-0 block w-full min-w-0 text-left transition-transform hover:-translate-y-0.5", compact && "p-2 pb-3", className));
	const tf = $derived(tilt ? `rotate(${tilt}deg)` : undefined);
</script>

{#snippet inner()}
	<span class="relative block">
		<img use:thumbnail={liftLandscape} {src} {alt} loading="lazy" class={cn("block w-full bg-[#eee9df] object-scale-down", imgClass)} />
		{#if stamp}<span class={cn("film-stamp absolute right-2 bottom-2 whitespace-nowrap", compact ? "right-1 bottom-1 text-[11px] sm:right-2 sm:bottom-2 sm:text-[13px]" : "text-[15px]")}>{stamp}</span>{/if}
	</span>
	{#if compact && title}<span class="mt-2 block truncate text-[13px]">{title}</span>{:else if title}<b class="mt-3 line-clamp-2 font-display text-[17px] leading-snug font-bold wrap-anywhere">{title}</b>{/if}
	{#if sub}<span class="line-clamp-2 text-[13px] wrap-anywhere text-[#5b6779]">{sub}</span>{/if}
{/snippet}

{#if onclick}
	<Button {id} variant="surface" {onclick} class={cls} style={tf ? `transform:${tf}` : undefined} aria-label={label || alt || title || "看大图"}>{@render inner()}</Button>
{:else}
	<figure class={cls} style:transform={tf}>{@render inner()}</figure>
{/if}
