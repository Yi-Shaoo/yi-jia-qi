<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { addWish, hasWish } from "$lib/wishes.svelte";
	import Star from "@lucide/svelte/icons/star";
	import Check from "@lucide/svelte/icons/check";

	let { text, label = "想去" }: { text: string; label?: string } = $props();
	const added = $derived(hasWish(text));
</script>

<Button
	variant={added ? "secondary" : "outline"}
	size="sm"
	class="rounded-full"
	disabled={added}
	onclick={() => addWish(text)}
>
	{#if added}<Check />已在心愿{:else}<Star />{label}{/if}
</Button>
