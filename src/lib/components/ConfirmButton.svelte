<script lang="ts">
	import { Button, type ButtonProps } from "$lib/components/ui/button";
	import type { Snippet } from "svelte";

	/** 点两下才执行：第一下变成“确定？”，3 秒内再点才真的删除 */
	let {
		onconfirm,
		confirmLabel = "确定删除？",
		children,
		variant = "ghost",
		size = "sm",
		class: className,
		...rest
	}: { onconfirm: () => void; confirmLabel?: string; children: Snippet } & Omit<ButtonProps, "onclick"> = $props();

	let sure = $state(false);
	let timer = 0;
	function click() {
		if (!sure) {
			sure = true;
			clearTimeout(timer);
			timer = window.setTimeout(() => (sure = false), 3000);
			return;
		}
		sure = false;
		onconfirm();
	}
</script>

<Button {...rest} variant={sure ? "destructive" : variant} size={sure ? "sm" : size} class={className} onclick={click}>
	{#if sure}{confirmLabel}{:else}{@render children()}{/if}
</Button>
