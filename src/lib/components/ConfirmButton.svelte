<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button, type ButtonProps } from "$lib/components/ui/button";
	import * as AlertDialog from "$lib/components/ui/alert-dialog";

	let {
		onconfirm, confirmLabel, description, children,
		variant = "ghost", size = "sm", class: className, disabled, ...rest
	}: {
		onconfirm: () => void | Promise<unknown>;
		confirmLabel?: string;
		description?: string;
		children: Snippet;
	} & Omit<ButtonProps, "onclick"> = $props();

	const action = $derived(confirmLabel ?? (rest["aria-label"] ? `确认${rest["aria-label"]}` : "确认删除"));
	let sure = $state(false);
	let busy = $state(false);

	async function confirm() {
		if (busy || !sure) return;
		busy = true;
		try {
			await onconfirm();
		} finally {
			sure = false;
			busy = false;
		}
	}
</script>

	<AlertDialog.Root bind:open={sure}>
		<AlertDialog.Trigger disabled={disabled || busy}>
			{#snippet child({ props })}
				<Button {...rest} {...props} {variant} {size} class={className}>{@render children()}</Button>
			{/snippet}
		</AlertDialog.Trigger>
		<AlertDialog.Content class="max-h-[90dvh] overflow-y-auto" escapeKeydownBehavior={busy ? "ignore" : "close"}>
			<AlertDialog.Header>
				<AlertDialog.Title class="wrap-anywhere">{action}</AlertDialog.Title>
				<AlertDialog.Description class="wrap-anywhere">{description || "删除后无法恢复。"}</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer class="flex-col sm:flex-row">
				<AlertDialog.Cancel disabled={busy}>取消</AlertDialog.Cancel>
				<AlertDialog.Action variant="destructive" class="h-auto min-h-9 whitespace-normal wrap-anywhere" disabled={busy} onclick={confirm}>{action}</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
