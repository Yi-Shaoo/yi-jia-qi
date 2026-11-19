<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import type { Snippet } from "svelte";

	let {
		open = $bindable(false),
		src,
		alt = "照片",
		title = "",
		children,
	}: { open?: boolean; src: string; alt?: string; title?: string; children?: Snippet } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-[min(92vw,960px)] gap-3 p-3 sm:p-4">
		<Dialog.Title class={title ? "px-1 font-display text-lg" : "sr-only"}>{title || alt}</Dialog.Title>
		<img {src} {alt} class="max-h-[72vh] w-full rounded-xl bg-muted object-contain" />
		{#if children}<div class="flex flex-wrap items-center gap-2 px-1">{@render children()}</div>{/if}
	</Dialog.Content>
</Dialog.Root>
