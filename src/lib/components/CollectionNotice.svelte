<script lang="ts">
	import { Button } from "$lib/components/ui/button";

	let { status, retry, label = "数据" }: {
		status: "loading" | "ready" | "error";
		retry: () => Promise<unknown>;
		label?: string;
	} = $props();

	let pending = $state(false);
	async function reload() {
		if (pending) return;
		pending = true;
		await retry().catch(() => {});
		pending = false;
	}
</script>

{#if status === "error"}
	<div class="my-3 flex flex-wrap items-center gap-3 text-sm">
		<span role="status">没能载入{label}。</span>
		<Button variant="outline" size="sm" disabled={pending} onclick={reload}>重试</Button>
	</div>
{:else if status === "loading"}
	<p class="my-3 text-sm text-muted-foreground" role="status">正在加载{label === "数据" ? "" : label}…</p>
{/if}
