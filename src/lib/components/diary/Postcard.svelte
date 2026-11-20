<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import PaperCard from "./PaperCard.svelte";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import { fileUrl } from "$lib/api";
	import { WHO, otherOf, type Diary, type DiarySide, type Who } from "$lib/types";
	import { fmtShort } from "$lib/dates";
	import Heart from "@lucide/svelte/icons/heart";
	import { sideHasContent } from "./entry";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import PenLine from "@lucide/svelte/icons/pen-line";

	let {
		who,
		side,
		kind,
		date,
		mine,
		hasDraft,
		disabled,
		onwrite,
	}: { who: Who; side: DiarySide | undefined; kind: Diary["kind"]; date: string; mine: boolean; hasDraft: boolean; disabled: boolean; onwrite?: () => void } = $props();

	const signature = $props.id();
	const has = $derived(sideHasContent(side));
	let open = $state(false);
</script>

<PaperCard {who} as="section" labelledby={signature}>
	<div class="post-address">
		<div class="post-from">
			<h3 id={signature}>From {WHO[who]}</h3>
			<small>To {WHO[otherOf(who)]}</small>
			{#if kind === "apart" && side?.pl?.trim()}<span class="post-place"><MapPin aria-hidden="true" /><span>{side.pl}</span></span>{/if}
		</div>
		<div class="post-frank" aria-hidden="true">
			<span class="post-seal"><b>{who === "yi" ? "IRVINE" : "WESTWOOD"}</b><span>{fmtShort(date)}</span></span>
			<span class="post-stamp"><Heart /></span>
		</div>
	</div>

	{#if has && side}
		{#if side.photo}
			<Button variant="surface" onclick={() => (open = true)} class="post-photo" aria-label={`${WHO[who]} 这天的照片`}>
				<img src={fileUrl(side.photo)} alt="" loading="lazy" class="max-h-64 w-full object-scale-down" />
			</Button>
			<Lightbox bind:open src={fileUrl(side.photo)} alt={`${WHO[who]} · ${date}`} title={`${WHO[who]} · ${date.replaceAll("-", ".")}`} />
		{/if}
		{#if side.t}<p class="post-text">{side.t}</p>{/if}
		{#if side.fav}
			<div class="post-moment">
				<span><Heart aria-hidden="true" />最喜欢的瞬间</span>
				<p>{side.fav}</p>
			</div>
		{/if}
	{:else if !mine || (!onwrite && !hasDraft)}
		<p class="text-sm text-muted-foreground">还没写</p>
	{/if}

	{#if mine && onwrite}
		<Button variant="outline" size="sm" class="mt-auto max-w-full border-(--trim) bg-(--paper) text-(--note-ink) hover:bg-(--note) hover:text-(--note-ink)" {disabled} onclick={onwrite}>
			<PenLine />{hasDraft ? "继续写草稿" : has ? "改我的这一边" : "写我的这一边"}
		</Button>
	{:else if mine && hasDraft}
		<p class="text-sm text-muted-foreground">有本机文字草稿</p>
	{/if}
</PaperCard>
