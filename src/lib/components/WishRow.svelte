<script lang="ts">
	import { toast } from "svelte-sonner";
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import { Button } from "$lib/components/ui/button";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { useCollection } from "$lib/sync.svelte";
	import { byOf, catOf } from "$lib/wish-list";
	import { recordDate } from "$lib/dates";
	import { heartBurst } from "$lib/fx";
	import { WHO, type Doc, type Who, type Wish } from "$lib/types";
	import { cn } from "$lib/utils";
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import Trash2 from "@lucide/svelte/icons/trash-2";

	let { wish, highlighted = false }: { wish: Doc<Wish>; highlighted?: boolean } = $props();
	const wishes = useCollection("wishes");
	const author = $derived(byOf(wish.data));
	const personal = $derived(catOf(wish.data) === "you");
	const wanted = $derived(personal && (wish.data.from === "yi" || wish.data.from === "jq") ? wish.data.from : "");
	const date = $derived(recordDate(wish.data.c));
	let busy = $state(false);
	let confirmDelete = $state(false);
	let trigger = $state<HTMLButtonElement | null>(null);

	async function update(patch: Partial<Wish>) {
		if (busy) return;
		busy = true;
		try {
			await wishes.update(wish.id, patch);
			if (patch.by) toast.success(`添加者已改为 ${WHO[patch.by]}`);
		} catch {
			toast.error("更改没能保存，请重试");
		} finally {
			busy = false;
		}
	}

	function changeAuthor(who: Who) {
		if (who !== author) return update({ by: who });
	}
</script>

<li id={`wish-${wish.id}`} tabindex="-1" aria-current={highlighted ? "location" : undefined} class={cn("flex min-w-0 scroll-my-24 items-start gap-2 border-b py-3 last:border-0 focus-visible:outline-2 focus-visible:outline-ring", highlighted && "-mx-2 rounded-lg border-transparent bg-sea-soft px-2 ring-2 ring-sea")}>
	<div class="flex min-w-0 flex-1 items-start gap-3">
		<Checkbox
			id={`w-${wish.id}`} checked={!!wish.data.d} disabled={busy} aria-labelledby={`title-${wish.id}`} class="wish-check -ml-2 size-11"
			onCheckedChange={(value) => {
				if (value === !!wish.data.d) return;
				if (value) heartBurst(document.getElementById(`w-${wish.id}`));
				update({ d: value });
			}}
		/>
		<div class="grid min-w-0 gap-1">
			<label id={`title-${wish.id}`} for={`w-${wish.id}`} class={cn("flex min-h-11 cursor-pointer items-center text-pretty wrap-anywhere", wish.data.d && "text-muted-foreground line-through")}>{wish.data.t}</label>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
				{#if wanted}<span class={cn("rounded-full px-2 py-0.5", wanted === "yi" ? "bg-yi-soft text-yi" : "bg-jq-soft text-jq")}>{WHO[wanted]} 想要</span>
				{:else if personal && author}<span>想要人未标注</span>{/if}
				<span>{author ? `${WHO[author]} 加的` : personal && !wanted ? "想要人和添加者均未标注" : "添加者未标注"}</span>
				{#if date}<time datetime={date.toISOString()} class="tabular-nums">{date.getMonth() + 1}.{date.getDate()}</time>{/if}
			</div>
		</div>
	</div>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger bind:ref={trigger} disabled={busy}>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon" aria-label={`更多操作：${wish.data.t}`}><Ellipsis aria-hidden="true" /></Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" onCloseAutoFocus={(e) => { if (confirmDelete) e.preventDefault(); }}>
			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>更改添加者</DropdownMenu.GroupHeading>
				{#each ["yi", "jq"] as const as who (who)}
					<DropdownMenu.Item disabled={who === author} onSelect={() => changeAuthor(who)}>{WHO[who]}{who === author ? "（当前）" : ""}</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onSelect={() => (confirmDelete = true)}><Trash2 aria-hidden="true" />删除心愿</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<AlertDialog.Root bind:open={confirmDelete}>
		<AlertDialog.Content onCloseAutoFocus={(e) => { e.preventDefault(); trigger?.focus(); }}>
			<AlertDialog.Header>
				<AlertDialog.Title>删除这条心愿？</AlertDialog.Title>
				<AlertDialog.Description class="wrap-anywhere">删除「{wish.data.t}」后无法恢复。</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>取消</AlertDialog.Cancel>
				<AlertDialog.Action variant="destructive" onclick={() => wishes.remove(wish.id).catch(() => toast.error("心愿没删掉，请重试"))}>确认删除</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</li>
