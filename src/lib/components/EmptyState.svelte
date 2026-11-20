<script lang="ts">
	import type { Snippet } from "svelte";
	import { Card } from "$lib/components/ui/card";

	let { message, children, announce = false }: { message: string; children?: Snippet; announce?: boolean } = $props();
</script>

<Card variant="surface" class="grid min-w-0 justify-items-start gap-3 p-5 md:p-6">
	<p role={announce ? "status" : undefined} class="text-sm text-muted-foreground">{message}</p>
	{#if children}<div class="flex min-w-0 flex-wrap items-start gap-2">{@render children()}</div>{/if}
</Card>
