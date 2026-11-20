<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import X from "@lucide/svelte/icons/x";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils";

	type Pager = { index: number; total: number; disabled: boolean; move: (step: number) => void };
	let {
		open = $bindable(false), src, alt = "照片", title = "", children, actions, pager, canClose, onreturn, sidePanel = false,
	}: { open?: boolean; src: string; alt?: string; title?: string; children?: Snippet; actions?: Snippet; pager?: Pager; sidePanel?: boolean; canClose?: () => boolean; onreturn?: () => void } = $props();

	const titleId = $props.id();
	let failedSrc = $state("");
	const imageSize = $derived(sidePanel ? "h-[clamp(8rem,calc(92dvh_-_20rem),60dvh)] md:h-[min(62dvh,38rem)]" : pager ? "h-[min(62dvh,38rem)]" : "max-h-[64dvh]");
	function turn(step: number) {
		if (!pager || pager.disabled || pager.index < 0 || pager.index + step < 0 || pager.index + step >= pager.total) return;
		pager.move(step);
	}
	function keydown(e: KeyboardEvent) {
		if (!pager || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"], [role="alertdialog"]'))) return;
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
		e.preventDefault();
		turn(e.key === "ArrowLeft" ? -1 : 1);
	}
	let start: { x: number; y: number; id: number } | null = null;
	function touchstart(e: TouchEvent) {
		const t = e.touches[0];
		start = pager && e.touches.length === 1 ? { x: t.clientX, y: t.clientY, id: t.identifier } : null;
	}
	function touchend(e: TouchEvent) {
		const t = e.changedTouches[0], from = start;
		start = null;
		if (!from || e.touches.length || from.id !== t.identifier) return;
		const dx = t.clientX - from.x, dy = t.clientY - from.y;
		if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) turn(dx < 0 ? 1 : -1);
	}
</script>

<Dialog.Root bind:open={() => open, (next) => { if (next || !canClose || canClose()) open = next; }}>
	<Dialog.Content class="max-h-[92dvh] gap-3 overflow-y-auto p-3 sm:max-w-[min(92vw,960px)] sm:p-4" showCloseButton={false} onkeydown={keydown}
		onOpenAutoFocus={(event) => { const heading = document.getElementById(titleId); if (heading) { event.preventDefault(); heading.focus({ preventScroll: true }); } }}
		onCloseAutoFocus={(e) => { if (onreturn) { e.preventDefault(); onreturn(); } }}>
		<div class="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0">
			<Dialog.Title id={titleId} tabindex={-1} class={title ? "min-w-0 flex-[1_1_5rem] truncate pl-1 font-display text-lg outline-none focus-visible:underline focus-visible:decoration-ring focus-visible:underline-offset-4" : "sr-only"}>{title || alt}</Dialog.Title>
			{@render actions?.()}
			<Dialog.Close>
				{#snippet child({ props })}<Button {...props} class="ml-auto size-11" variant="ghost" size="icon" aria-label="关闭"><X /></Button>{/snippet}
			</Dialog.Close>
		</div>
		<div class={cn("grid min-w-0 gap-3", sidePanel && "md:grid-cols-[minmax(0,1fr)_minmax(13rem,16rem)] md:items-start md:gap-5")}>
		<div class="grid min-w-0 gap-2">
		{#if failedSrc === src}
			<div class={cn("grid min-h-28 place-content-center justify-items-center gap-3 rounded-xl bg-muted p-4", imageSize)}>
				<p role="status" class="text-sm text-muted-foreground">照片没能打开。</p>
				<Button variant="outline" size="sm" onclick={() => (failedSrc = "")}>重新加载照片</Button>
			</div>
		{:else}
			<img {src} {alt} onerror={() => (failedSrc = src)} ontouchstart={touchstart} ontouchend={touchend} ontouchcancel={() => (start = null)} class:touch-pan-y={!!pager} class:touch-pinch-zoom={!!pager} class={cn("w-full rounded-xl bg-muted object-scale-down", imageSize)} />
		{/if}
		{#if pager}
			<div class="mx-auto flex items-center gap-2">
				<Button variant="ghost" size="icon" class="aria-disabled:opacity-40" aria-label="上一张" aria-disabled={pager.disabled || pager.index <= 0} onclick={() => turn(-1)}><ChevronLeft /></Button>
				<span role="status" class="min-w-16 text-center font-mono text-sm tabular-nums">{pager.index < 0 ? "已移出当前分类" : `${pager.index + 1} / ${pager.total}`}</span>
				<Button variant="ghost" size="icon" class="aria-disabled:opacity-40" aria-label="下一张" aria-disabled={pager.disabled || pager.index < 0 || pager.index + 1 >= pager.total} onclick={() => turn(1)}><ChevronRight /></Button>
			</div>
		{/if}
		</div>
		{#if children}<div class={cn("flex min-w-0 flex-wrap items-center gap-2 px-1", sidePanel && "md:flex-col md:items-stretch md:gap-4 md:border-l md:pl-5")}>{@render children()}</div>{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
