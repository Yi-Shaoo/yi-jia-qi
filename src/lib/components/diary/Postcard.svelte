<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import { fileUrl } from "$lib/api";
	import { WHO, otherOf, type DiarySide, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import PenLine from "@lucide/svelte/icons/pen-line";

	let {
		who,
		side,
		date,
		mine,
		onwrite,
	}: { who: Who; side: DiarySide | undefined; date: string; mine: boolean; onwrite: () => void } = $props();

	const POST: Record<Who, string> = { yi: "IRVINE", jq: "WESTWOOD" };
	const has = $derived(!!(side && (side.t || side.fav || side.photo)));
	let open = $state(false);
</script>

<div
	class={cn(
		"relative flex flex-col gap-3 rounded-2xl border p-4 md:p-5",
		has ? "bg-[#fffdf9] text-[#3b2f2a] dark:bg-[#221d1e] dark:text-[#f1e6dd]" : "border-dashed bg-transparent",
		who === "yi" ? "border-yi/25" : "border-jq/25",
	)}
	style:background-image={has ? "repeating-linear-gradient(transparent 0 27px, rgb(230 190 170 / 0.28) 27px 28px)" : undefined}
>
	<div class="flex items-start justify-between gap-3">
		<div class="flex flex-col leading-tight">
			<span class={cn("font-display text-lg font-bold", who === "yi" ? "text-yi" : "text-jq")}>From {WHO[who]}</span>
			<small class="text-xs opacity-70">To {WHO[otherOf(who)]}</small>
			{#if side?.pl}<span class="mt-1 text-xs opacity-80">📍 {side.pl}</span>{/if}
		</div>
		<div class="flex items-center gap-2" aria-hidden="true">
			<div class="flex size-14 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-dashed border-current/30 font-mono text-[9px] leading-tight opacity-70">
				<b>{POST[who]}</b><span>{date.slice(5).replace("-", ".")}</span>
			</div>
			<div class={cn("flex size-11 items-center justify-center rounded-sm border-2 border-dotted text-lg", who === "yi" ? "border-yi/40 text-yi" : "border-jq/40 text-jq")}>♥</div>
		</div>
	</div>

	{#if has && side}
		{#if side.photo}
			<button type="button" onclick={() => (open = true)} class="overflow-hidden rounded-lg" aria-label={`${WHO[who]} 这天的照片`}>
				<img src={fileUrl(side.photo)} alt="" loading="lazy" class="max-h-64 w-full object-cover" />
			</button>
			<Lightbox bind:open src={fileUrl(side.photo)} alt={`${WHO[who]} · ${date}`} title={`${WHO[who]} · ${date.replaceAll("-", ".")}`} />
		{/if}
		{#if side.t}<p class="text-[15px] leading-7 whitespace-pre-line">{side.t}</p>{/if}
		{#if side.fav}
			<div class="rounded-xl bg-black/[0.04] px-3 py-2 dark:bg-white/5">
				<span class="text-xs font-semibold opacity-70">最喜欢的瞬间</span>
				<div class="text-[15px]">{side.fav}</div>
			</div>
		{/if}
	{:else}
		<p class="py-6 text-center text-sm text-muted-foreground">这边的位置留给{mine ? "你" : ` ${WHO[who]}`}</p>
	{/if}

	{#if mine}
		<Button variant={has ? "ghost" : "default"} size="sm" class="mt-auto self-start rounded-full" onclick={onwrite}>
			<PenLine />{has ? "改我的这一边" : "写我的这一边"}
		</Button>
	{/if}
</div>
