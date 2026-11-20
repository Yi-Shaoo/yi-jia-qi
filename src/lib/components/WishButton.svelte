<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button, type ButtonSize } from "$lib/components/ui/button";
	import { useCollection } from "$lib/sync.svelte";
	import type { WishCat } from "$lib/types";
	import { addWish, findWish, wishHref } from "$lib/wishes.svelte";
	import Star from "@lucide/svelte/icons/star";

	let { text, cat, label = "加入心愿", size = "sm", variant = "outline" }: { text: string; cat?: WishCat; label?: string; size?: ButtonSize; variant?: "default" | "outline" } = $props();
	const wishes = useCollection("wishes");
	const existing = $derived(findWish(wishes.docs, text));
	let busy = $state(false);
	const action = $derived(wishes.status === "loading" ? "正在载入心愿…" : !wishes.ready ? "重试载入心愿" : busy ? "正在加入…" : label);

	async function activate() {
		if (busy || existing) return;
		busy = true;
		try {
			if (wishes.ready) await addWish(text, cat);
			else await wishes.load().catch(() => toast.error("没能载入心愿清单，请重试"));
		} finally {
			busy = false;
		}
	}
</script>

{#if existing}
	<Button variant="secondary" {size} href={wishHref(existing.id)} aria-label={`已在心愿，查看：${existing.data.t}`}>
		<Star class="fill-current" />已在心愿
	</Button>
{:else}
	<Button {variant} {size} disabled={busy || wishes.status === "loading"} aria-label={`${action}：${text}`} onclick={activate}>
		<Star />{action}
	</Button>
{/if}
