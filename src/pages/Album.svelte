<script lang="ts">
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import PhotoActions from "$lib/components/PhotoActions.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { deletePhoto } from "$lib/upload";
	import { uploadBatch, type SelectedPhoto } from "$lib/photo-batch";
	import { uploadStamp } from "$lib/dates";
	import Polaroid from "$lib/components/Polaroid.svelte";
	import EmptyState from "$lib/components/EmptyState.svelte";
	import type { Doc, Photo, PhotoTag } from "$lib/types";

	import Upload from "@lucide/svelte/icons/upload";

	const photos = useCollection("photos");
	type F = "all" | "sea" | "trip" | "daily" | "none";
	const FILTERS: Record<F, string> = { all: "全部", sea: "海边", trip: "旅行", daily: "日常", none: "还没分类" };
	const TAGS: Record<PhotoTag, string> = { "": "未分类", sea: "海边", trip: "旅行", daily: "日常" };
	let filter = $state<F>("all");
	const tag = $derived(filter === "all" || filter === "none" ? "" : filter);
	const all = $derived(photos.docs.filter((d) => /^[0-9a-f]{32}$/.test(d.data?.asset ?? "")).sort((a, b) => (b.data.c ?? 0) - (a.data.c ?? 0)));
	const list = $derived(all.filter((d) => filter === "all" || (d.data.tag ?? "") === tag));
	const empty = $derived(photos.ready && !list.length);
	const emptyText = $derived(!photos.docs.length ? "还没有照片" : !all.length ? "现有照片缺少有效图片，暂时无法显示。" :
		filter === "none" ? "还没有未分类的照片" : `${FILTERS[filter]}分类还没有照片`);

	type AlbumUpload = SelectedPhoto & { tag: PhotoTag; created: number };
	let input = $state<HTMLInputElement | null>(null);
	let failed = $state<AlbumUpload[]>([]);
	const retryable = $derived(failed.filter((item) => item.error?.retryable));
	let uploading = $state(false);
	let msg = $state("");
	async function storePhotos(batch: AlbumUpload[], retained: AlbumUpload[]) {
		if (uploading || !batch.length) return;
		uploading = true;
		try {
			await uploadBatch(batch, {
				onProgress: (i, total) => (msg = `正在存入相册 ${i} / ${total}…`),
				addToAlbum: async (p, asset) => {
					const doc = await photos.set(asset, { asset, cap: "", c: p.created, tag: p.tag });
					if (doc.id !== asset || doc.data?.asset !== asset) throw new Error("album-receipt");
				},
			});
			const missed = batch.filter((p) => p.error);
			const ok = batch.length - missed.length;
			failed = [...retained, ...missed];
			msg = [ok ? `已存入相册 ${ok} 张。` : "", failed.length ? `${failed.length} 张未存入相册。` : ""].join("");
		} finally {
			uploading = false;
		}
	}
	function onFiles(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const batch: AlbumUpload[] = Array.from(el.files ?? [], (file) => ({ file, tag, created: Date.now() }));
		el.value = "";
		void storePhotos(batch, failed);
	}
	function dropFailed(item: AlbumUpload) {
		failed = failed.filter((p) => p !== item);
		msg = failed.length ? `${failed.length} 张未存入相册。` : "";
	}

	let selected = $state<string | null>(null);
	const cur = $derived(selected && photos.get(selected));
	const index = $derived(list.findIndex((p) => p.id === selected));
	let savedName = $state("");
	let open = $state(false);
	let cap = $state("");
	let saving = $state(false);
	function photoName(p: Photo, index: number) {
		return `第 ${index + 1} 张照片${p.cap ? `「${p.cap}」` : ""}`;
	}
	function view(p: Doc<Photo>) {
		selected = p.id;
		cap = savedName = p.data.cap ?? "";
		open = true;
	}
	const dirty = $derived(cap.trim() !== savedName);
	let askDiscard = $state(false);
	let afterDiscard: (() => void) | null = null;
	function guard(action: () => void) {
		if (saving || askDiscard) return false;
		if (!dirty) return true;
		afterDiscard = action;
		askDiscard = true;
		return false;
	}
	function discard() {
		cap = savedName;
		const action = afterDiscard;
		afterDiscard = null;
		askDiscard = false;
		action?.();
	}
	function move(step: number) {
		const next = list[index + step];
		if (next && guard(() => view(next))) view(next);
	}
	async function saveCap(e: SubmitEvent) {
		e.preventDefault();
		if (!cur || saving) return;
		saving = true;
		try {
			const result = await photos.update(cur.id, { cap: cap.trim().slice(0, 40) });
			cap = savedName = result.data.cap ?? "";
			toast.success("名字已保存");
		} catch {
			toast.error("名字未保存，请重试");
		} finally {
			saving = false;
		}
	}
	async function setTag(next: PhotoTag) {
		if (!cur || saving || (cur.data.tag ?? "") === next) return;
		const leavesFilter = filter !== "all" && next !== tag;
		if (leavesFilter && !guard(() => { void setTag(next); })) return;
		const at = index;
		saving = true;
		try {
			await photos.update(cur.id, { tag: next });
			if (leavesFilter) {
				const neighbor = list[Math.min(at, list.length - 1)];
				if (neighbor) view(neighbor);
				else open = false;
			}
		} catch {
			toast.error("分类未保存，请重试");
		} finally {
			saving = false;
		}
	}
	async function remove(p: Doc<Photo>) {
		if (saving) return;
		saving = true;
		try {
			await photos.remove(p.id);
			void deletePhoto(p.data.asset);
			if (selected === p.id) open = false;
			toast("照片已删除");
		} catch {
			toast.error("照片未删除，请重试");
		} finally {
			saving = false;
		}
	}

	const masonryStep = 4;
	const masonryGap = 16;
	function sizeTile(tile: HTMLElement) {
		const fit = () => {
			const rows = Math.ceil((tile.getBoundingClientRect().height + masonryGap) / masonryStep);
			tile.style.gridRowEnd = `span ${rows}`;
		};
		const observer = new ResizeObserver(fit);
		observer.observe(tile);
		fit();
		return { destroy: () => observer.disconnect() };
	}
</script>

{#snippet uploadAction()}
	<Button disabled={uploading} onclick={() => input?.click()}>
		<Upload />{tag ? `上传到${TAGS[tag]}` : "上传照片"}
	</Button>
{/snippet}

<Input bind:ref={input} type="file" accept="image/*" multiple class="hidden" onchange={onFiles} />
<PageHeader title="情侣相册" stackActions actions={empty ? undefined : uploadAction} />

<div id="album-filters" class="mb-5 flex flex-col gap-3">
	<FilterChips options={FILTERS} bind:value={filter} label="照片分类" wrap />
	{#if msg}<p class="text-sm text-muted-foreground" role="status">{msg}</p>{/if}
	{#if failed.length}
		<ul class="grid max-w-xl gap-2 text-sm" aria-label="未存入相册的照片">
			{#each failed as item (item)}
				<li class="flex items-baseline justify-between gap-3">
					<span class="min-w-0 break-words"><b>{item.file.name}</b>：{item.error?.message}</span>
					<Button size="xs" variant="ghost" disabled={uploading} aria-label={`移除失败项 ${item.file.name}`} onclick={() => dropFailed(item)}>移除</Button>
				</li>
			{/each}
		</ul>
		{#if retryable.length}
			<Button class="self-start" variant="outline" size="sm" disabled={uploading} onclick={() => storePhotos(retryable, failed.filter((item) => !item.error?.retryable))}>重试 {retryable.length} 张照片</Button>
		{/if}
	{/if}
</div>

<CollectionNotice status={photos.status} retry={() => photos.load()} />
{#if empty}
	<EmptyState message={emptyText}>
		{@render uploadAction()}
		{#if filter !== "all"}<Button variant="outline" onclick={() => (filter = "all")}>查看全部</Button>{/if}
		{#if !photos.docs.length && filter === "all"}<Button href="/memories" variant="link">去回忆时间线看照片</Button>{/if}
	</EmptyState>
{:else if list.length}
	<div style:grid-auto-rows={`${masonryStep}px`} style:column-gap={`${masonryGap}px`} class="grid grid-cols-2 items-start md:grid-cols-3 lg:grid-cols-4">
		{#each list as p, i (p.id)}
			{@const stamp = p.data.st?.trim() || uploadStamp(p.data.c)}
			<div class="min-w-0" use:sizeTile>
				<Polaroid compact id={`photo-${p.id}`} src={fileUrl(p.data.asset)} {stamp} title={p.data.cap || ""}
					alt={p.data.cap || photoName(p.data, i)} imgClass="h-auto" aria-label={`查看${photoName(p.data, i)}`} onclick={() => view(p)} />
			</div>
		{/each}
	</div>
{/if}

{#if cur && selected}
	{@const name = index >= 0 ? photoName(cur.data, index) : cur.data.cap || "照片"}
	<Lightbox bind:open sidePanel src={fileUrl(cur.data.asset)} alt={name} title={cur.data.cap || "照片"}
		pager={list.length > 1 ? { index, total: list.length, disabled: saving, move } : undefined} canClose={() => guard(() => { open = false; })}
		onreturn={() => (document.getElementById(`photo-${selected}`) ?? document.querySelector<HTMLElement>("#album-filters input:checked"))?.focus()}>
		<form onsubmit={saveCap} class="grid w-full gap-1.5">
			<Label for="album-name">照片名</Label>
			<div class="flex gap-2 md:flex-col md:items-start">
				<Input id="album-name" bind:value={cap} maxlength={40} disabled={saving} />
				<Button type="submit" variant={dirty ? "default" : "secondary"} disabled={saving || !dirty}>保存名字</Button>
			</div>
		</form>
		<fieldset class="mt-2 min-w-0" disabled={saving}>
			<legend class="mb-2 text-sm font-medium">分类</legend>
			<div class="flex flex-wrap gap-1.5">
				{#each Object.entries(TAGS) as [k, v] (k)}
					<Button size="sm" variant={(cur.data.tag ?? "") === k ? "default" : "outline"} aria-pressed={(cur.data.tag ?? "") === k} onclick={() => setTag(k as PhotoTag)}>{v}</Button>
				{/each}
			</div>
		</fieldset>
		{#snippet actions()}<PhotoActions disabled={saving} description={`从相册删除${name}？无法撤销。`} remove={() => { if (cur) return remove(cur); }} />{/snippet}
	</Lightbox>
	<AlertDialog.Root bind:open={askDiscard}>
		<AlertDialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); if (open) document.querySelector<HTMLElement>('[data-slot="dialog-content"] [data-slot="dialog-title"]')?.focus(); }}>
			<AlertDialog.Header>
				<AlertDialog.Title>放弃照片名修改？</AlertDialog.Title>
				<AlertDialog.Description>照片名尚未保存。放弃后会保留原名。</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>继续编辑</AlertDialog.Cancel>
				<AlertDialog.Action variant="destructive" onclick={discard}>放弃修改</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
