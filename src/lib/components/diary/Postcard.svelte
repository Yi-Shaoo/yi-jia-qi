<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import { fileUrl } from "$lib/api";
	import { WHO, type DiarySide, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import { sideHasContent } from "./entry";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import PenLine from "@lucide/svelte/icons/pen-line";

	let {
		who,
		side,
		date,
		mine,
		hasDraft,
		disabled,
		onwrite,
	}: { who: Who; side: DiarySide | undefined; date: string; mine: boolean; hasDraft: boolean; disabled: boolean; onwrite?: () => void } = $props();

	const has = $derived(sideHasContent(side));
	let open = $state(false);
</script>

<section class="flex min-w-0 flex-col items-start gap-3 py-4 wrap-anywhere last:pb-0 md:pb-0 md:first:pr-5 md:last:pl-5">
	<div class="flex flex-wrap items-baseline gap-x-3">
		<h3 class={cn("text-lg font-semibold", who === "yi" ? "text-yi" : "text-jq")}>From {WHO[who]}</h3>
		{#if side?.pl}<span class="inline-flex items-baseline gap-1 text-xs text-muted-foreground"><MapPin aria-hidden="true" class="size-3 shrink-0 self-center" />{side.pl}</span>{/if}
	</div>

	{#if has && side}
		{#if side.photo}
			<button type="button" onclick={() => (open = true)} class="w-full overflow-hidden rounded-lg" aria-label={`${WHO[who]} 这天的照片`}>
				<img src={fileUrl(side.photo)} alt="" loading="lazy" class="max-h-64 w-full object-cover" />
			</button>
			<Lightbox bind:open src={fileUrl(side.photo)} alt={`${WHO[who]} · ${date}`} title={`${WHO[who]} · ${date.replaceAll("-", ".")}`} />
		{/if}
		{#if side.t}<p class="text-[15px] leading-7 whitespace-pre-line">{side.t}</p>{/if}
		{#if side.fav}
			<div class="border-l-2 border-coral/40 pl-3">
				<span class="text-xs font-semibold opacity-70">最喜欢的瞬间</span>
				<div class="text-[15px]">{side.fav}</div>
			</div>
		{/if}
	{:else if !mine || (!onwrite && !hasDraft)}
		<p class="text-sm text-muted-foreground">还没写</p>
	{/if}

	{#if mine && onwrite}
		<Button variant={has ? "ghost" : "default"} size="sm" class={cn("mt-auto self-start rounded-full", has && "-ml-3")} {disabled} onclick={onwrite}>
			<PenLine />{hasDraft ? "继续写草稿" : has ? "改我的这一边" : "写我的这一边"}
		</Button>
	{:else if mine && hasDraft}
		<p class="text-sm text-muted-foreground">有本机文字草稿</p>
	{/if}
</section>
