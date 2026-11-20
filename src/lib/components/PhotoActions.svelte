<script lang="ts">
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Button } from "$lib/components/ui/button";
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import Trash2 from "@lucide/svelte/icons/trash-2";

	let { description, remove, disabled = false }: { description: string; remove: () => void | Promise<void>; disabled?: boolean } = $props();
	let trigger = $state<HTMLButtonElement | null>(null);
	let confirm = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger bind:ref={trigger} {disabled}>
		{#snippet child({ props })}<Button {...props} variant="ghost" size="icon" aria-label="照片操作"><Ellipsis aria-hidden="true" /></Button>{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" onCloseAutoFocus={(event) => { if (confirm) event.preventDefault(); }}>
		<DropdownMenu.Item variant="destructive" onSelect={() => (confirm = true)}><Trash2 aria-hidden="true" />删除这张照片</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
<AlertDialog.Root bind:open={confirm}>
	<AlertDialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); trigger?.focus(); }}>
		<AlertDialog.Header>
			<AlertDialog.Title>删除这张照片？</AlertDialog.Title>
			<AlertDialog.Description class="wrap-anywhere">{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>取消</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={remove}>删除照片</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
