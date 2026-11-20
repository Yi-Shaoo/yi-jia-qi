<script lang="ts">
	import EmptyState from "$lib/components/EmptyState.svelte";
	import { onDestroy, tick } from "svelte";
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import MemoryText from "$lib/components/MemoryText.svelte";
	import Polaroid from "$lib/components/Polaroid.svelte";
	import PhotoActions from "$lib/components/PhotoActions.svelte";
	import Pencil from "@lucide/svelte/icons/pencil";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { Button } from "$lib/components/ui/button";
	import { DatePicker } from "$lib/components/ui/date-picker";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as Dialog from "$lib/components/ui/dialog";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { query } from "$lib/router.svelte";
	import { deletePhoto } from "$lib/upload";
	import { createMemoryDraft, releasePreview, saveMemoryDraft, type MemoryDraft } from "$lib/memory-draft";
	import { filmStamp, fmtDots, todayKey } from "$lib/dates";
	import { groupMemories, isMemoryDate, memoryTitle } from "$lib/memory-timeline";
	import { THANKS, XMAS } from "$lib/data/content";
	import type { Doc, Memory } from "$lib/types";
	import Plus from "@lucide/svelte/icons/plus";
	import X from "@lucide/svelte/icons/x";
	import ImagePlus from "@lucide/svelte/icons/image-plus";

	const memories = useCollection("memories");
	const { timeline: list, pending } = $derived(groupMemories(memories.docs));
	const empty = $derived(memories.ready && !memories.docs.length);
	const plans = [THANKS, XMAS].filter((p) => p.date >= todayKey());
	const item = $derived(query("item"));
	const target = $derived(item && memories.get(item)?.id);
	$effect(() => {
		if (!target) return;
		const heading = document.getElementById(`memory-${target}`);
		heading?.focus({ preventScroll: true });
		heading?.scrollIntoView({ block: "center" });
	});

	function photoName(title: string, index: number) {
		return `「${title.trim() || "新回忆"}」第 ${index + 1} 张照片`;
	}
	let lb = $state<{ id: string; photo: string; index: number } | null>(null);
	let lbOpen = $state(false);
	const lbMemory = $derived(lb && memories.get(lb.id));
	const lbIndex = $derived(lb && lbMemory ? (lbMemory.data.photos?.[lb.index] === lb.photo ? lb.index : (lbMemory.data.photos?.indexOf(lb.photo) ?? -1)) : -1);
	let removingPhoto = $state(false);
	function turnPhoto(step: number) {
		if (!lbMemory || lbIndex < 0 || removingPhoto) return;
		const index = lbIndex + step, photo = lbMemory.data.photos[index];
		if (photo) lb = { id: lbMemory.id, photo, index };
	}
	function returnToPhoto() {
		if (!lb) return;
		const thumb = document.getElementById(`memory-photo-${lb.id}-${Math.max(0, lbIndex)}`);
		(thumb ?? document.getElementById(`memory-${lb.id}`))?.focus();
	}
	async function removePhotoFromMemory() {
		if (!lb || !lbMemory || lbIndex < 0 || removingPhoto) return;
		const { id, photo } = lb;
		const remaining = lbMemory.data.photos.filter((_, i) => i !== lbIndex);
		removingPhoto = true;
		try {
			await memories.update(id, { photos: remaining });
			if (!remaining.includes(photo)) void deletePhoto(photo);
			lbOpen = false;
			toast("照片已删除");
		} catch {
			toast.error("照片未删除，请重试");
		} finally {
			removingPhoto = false;
		}
	}

	let draft = $state<MemoryDraft | null>(null);
	let repairId: string | null = null;
	let message = $state("");
	let busy = $state(false);
	let saveFailed = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	const savedRecord = $derived(draft?.saved ? memories.get(draft.id) : undefined);
	const failed = $derived(draft?.photos.flatMap((p) => ("file" in p && p.error ? [{ name: p.file.name, error: p.error }] : [])) ?? []);
	const hasFailures = $derived(saveFailed || failed.length > 0);
	const retryable = $derived(failed.some((item) => item.error.retryable));
	const removedCount = $derived(draft?.saved?.photos?.filter((id) => !draft?.photos.some((p) => p.asset === id)).length ?? 0);

	const onlyRejected = $derived(!saveFailed && failed.length > 0 && draft?.saved && !removedCount &&
		draft.photos.every((p) => !("file" in p) || p.error?.retryable === false) &&
		draft.date === draft.saved.date && (draft.title === draft.saved.title || draft.title.trim() === draft.saved.title) &&
		(draft.text === draft.saved.text || draft.text.trim() === (draft.saved.text ?? "")));

	function openEditor(item: Doc<Memory> | null) {
		draft = createMemoryDraft(item);
		repairId = item && pending.some((m) => m.id === item.id) ? item.id : null;
		message = "";
		saveFailed = false;
	}
	function closeEditor() {
		const repaired = repairId && list.find((m) => m.id === repairId);
		repairId = null;
		draft?.photos.forEach(releasePreview);
		draft = null;
		if (repaired) void tick().then(() => document.getElementById(`memory-${repaired.id}`)?.focus());
	}
	onDestroy(() => draft?.photos.forEach(releasePreview));
	function onFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (draft && !busy) draft.photos.push(...Array.from(input.files ?? [], (file) => ({ file, preview: URL.createObjectURL(file) })));
		input.value = "";
	}
	function removePreview(index: number) {
		if (!draft || busy) return;
		releasePreview(draft.photos[index]);
		draft.photos.splice(index, 1);
		message = "";
	}
	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (!draft || busy || onlyRejected) return;
		if (!isMemoryDate(draft.date)) {
			message = "选一下日期";
			document.getElementById("m-date")?.focus();
			return;
		}
		if (!draft.title.trim()) return (message = "写一个标题");
		busy = true;
		message = "正在保存回忆…";
		try {
			const missed = await saveMemoryDraft(draft, memories, (i, total) => (message = `正在上传照片 ${i} / ${total}…`));
			saveFailed = false;
			if (missed) {
				message = `回忆已保存，${missed} 张照片未上传。`;
			} else {
				toast.success("回忆已保存");
				closeEditor();
			}
		} catch {
			saveFailed = true;
			message = "未能确认回忆已保存，请重试保存。";
		} finally {
			busy = false;
		}
	}
	async function removeMemory(m: Doc<Memory>) {
		if (busy) return;
		busy = true;
		try {
			await memories.remove(m.id);
			(m.data.photos ?? []).forEach((photo) => { void deletePhoto(photo); });
			closeEditor();
			toast("回忆已删除");
		} catch {
			toast.error("回忆未删除，请重试");
		} finally {
			busy = false;
		}
	}
</script>

{#snippet addMemory()}
	<Button class="rounded-full" onclick={() => openEditor(null)}><Plus />添加一段回忆</Button>
{/snippet}

{#snippet dateLabel(date: string)}
	<time datetime={date} class="font-mono text-xs text-muted-foreground [word-spacing:-0.5ch]">{fmtDots(date)}</time>
{/snippet}

<PageHeader title="我们的回忆" actions={empty ? undefined : addMemory} />

<CollectionNotice status={memories.status} retry={() => memories.load()} />
{#if memories.ready && item && !target}<p role="status" class="mb-4 text-sm text-muted-foreground">找不到这段回忆。</p>{/if}
{#if empty}
	<EmptyState message="还没有回忆" children={addMemory} />
{:else if list.length}
	<ol class="relative flex flex-col gap-10 pl-8 before:absolute before:top-2 before:bottom-0 before:left-[11px] before:w-0.5 before:bg-border md:pl-12 md:before:left-[19px]">
		{#each list as m, index (m.id)}
			<li class="relative">
				<span aria-hidden="true" class={["absolute top-1.5 -left-[25px] size-3 rounded-full ring-4 ring-background md:-left-[35px] md:size-3.5", ["bg-coral", "bg-primary", "bg-sun"][index % 3]]}></span>
				<article class={m.data.photos?.length ? "grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8" : "max-w-prose"}>
				<div class="min-w-0">
				{@render dateLabel(m.data.date)}
				<div class="mt-1 flex items-start gap-2">
					<h2 id={`memory-${m.id}`} tabindex="-1" class="min-w-0 self-center rounded-sm text-2xl font-bold text-balance wrap-anywhere focus:outline-2 focus:outline-offset-4 focus:outline-sea">{m.data.title}</h2>
					<Button variant="ghost" size="icon" class="text-muted-foreground" title="编辑回忆" aria-label={`编辑回忆：${m.data.title}`} onclick={() => openEditor(m)}><Pencil aria-hidden="true" /></Button>
				</div>
				{#if m.data.text}<MemoryText text={m.data.text} />{/if}
				</div>
				{#if m.data.photos?.length}
					<div class="grid min-w-0 items-start grid-cols-2 gap-4 sm:grid-cols-3">
						{#each m.data.photos as p, i}
							{@const name = photoName(m.data.title, i)}
							<Polaroid liftLandscape id={`memory-photo-${m.id}-${i}`} src={fileUrl(p)} alt={name} aria-label={`查看${name}`}
								stamp={i === 0 ? filmStamp(m.data.date) : ""} tilt={[-2, 1.5, -1, 2][i % 4]}
								imgClass="h-auto" class="p-2"
								onclick={() => { lb = { id: m.id, photo: p, index: i }; lbOpen = true; }} />
						{/each}
					</div>
				{/if}
				</article>
			</li>
		{/each}
	</ol>
	{#if plans.length}
		<section aria-labelledby="memory-plans" class="mt-10 max-w-xl border-t pt-5">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 id="memory-plans" class="text-lg font-bold">节日计划</h2>
				<Button href="/wish" variant="link">心愿清单</Button>
			</div>
			<ul class="mt-2 grid gap-1.5">
				{#each plans as plan (plan.date)}
					<li class="flex flex-wrap items-baseline gap-x-3">{@render dateLabel(plan.date)}第一个{plan.title}</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

{#snippet deleteMemoryButton(saved: Doc<Memory>)}
	{@const name = memoryTitle(saved.data.title) || "未命名回忆"}
	{@const n = saved.data.photos?.length ?? 0}
	<ConfirmButton variant="ghost" class="justify-self-start text-destructive" disabled={busy} aria-label={`删除回忆：${name}`} confirmLabel="删除回忆"
		description={`删除「${name}」${n ? `和已保存的 ${n} 张照片` : ""}？无法撤销。`} onconfirm={() => removeMemory(saved)}>删除回忆</ConfirmButton>
{/snippet}

{#if pending.length}
	<section aria-labelledby="pending-memories" class="mt-8 max-w-prose border-t pt-5">
		<h2 id="pending-memories" class="text-xl font-bold">待整理的回忆</h2>
		<ul class="mt-2 divide-y">
			{#each pending as m (m.id)}
				{@const title = memoryTitle(m.data.title) || "未命名回忆"}
				<li class="grid gap-1 py-3 wrap-anywhere">
					<h3 id={`memory-${m.id}`} tabindex="-1" class="font-semibold">{title}</h3>
					<p class="text-sm text-muted-foreground">
						{#if isMemoryDate(m.data.date)}{@render dateLabel(m.data.date)} · 缺少标题
						{:else}{m.data.date ? `日期无效：${m.data.date}` : "缺少日期"}{memoryTitle(m.data.title) ? "" : " · 缺少标题"}{/if}
					</p>
					{#if m.data.text}<p class="line-clamp-2 text-sm">{m.data.text}</p>{/if}
					{#if m.data.photos?.length}
						<div class="my-1 flex items-center gap-2 text-sm text-muted-foreground">
							<img src={fileUrl(m.data.photos[0])} alt="" loading="lazy" class="size-14 rounded-lg bg-muted object-scale-down" />
							<span>{m.data.photos.length} 张照片</span>
						</div>
					{/if}
					<div class="flex flex-wrap gap-2">
						<Button size="sm" variant="outline" disabled={busy} aria-label={`编辑回忆：${title}`} onclick={() => openEditor(m)}>编辑回忆</Button>
						{@render deleteMemoryButton(m)}
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if lb && lbMemory && lbIndex >= 0}
	{@const name = photoName(lbMemory.data.title, lbIndex)}
	<Lightbox bind:open={lbOpen} src={fileUrl(lb.photo)} alt={name} title={lbMemory.data.title}
		pager={lbMemory.data.photos.length > 1 ? { index: lbIndex, total: lbMemory.data.photos.length, disabled: removingPhoto, move: turnPhoto } : undefined}
		canClose={() => !removingPhoto} onreturn={returnToPhoto}>
		{#snippet actions()}<PhotoActions disabled={removingPhoto} description={`删除${name}？无法撤销。`} remove={removePhotoFromMemory} />{/snippet}
	</Lightbox>
{/if}

<Dialog.Root bind:open={() => !!draft, (open) => { if (!open && !busy) closeEditor(); }}>
	{#if draft}
		<Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-lg" showCloseButton={!busy && !hasFailures}
			onOpenAutoFocus={(event) => { const heading = document.getElementById("memory-editor-title"); if (heading) { event.preventDefault(); heading.focus({ preventScroll: true }); } }}
			escapeKeydownBehavior={busy || hasFailures ? "ignore" : "close"} interactOutsideBehavior={busy || hasFailures ? "ignore" : "close"}>
			<Dialog.Header>
				<Dialog.Title id="memory-editor-title" tabindex={-1} class="pr-10 font-display text-xl outline-none">{draft.saved ? "编辑回忆" : "添加一段回忆"}</Dialog.Title>
			</Dialog.Header>
			<form onsubmit={save} oninput={() => (message = "")} class="flex flex-col gap-4">
				<div class="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
					<div class="grid gap-1.5"><Label for="m-date">日期</Label><DatePicker id="m-date" bind:value={draft.date} disabled={busy} onValueChange={() => (message = "")} /></div>
					<div class="grid gap-1.5"><Label for="m-title">标题</Label><Input id="m-title" bind:value={draft.title} maxlength={40} required disabled={busy} /></div>
				</div>
				<div class="grid gap-1.5">
					<Label for="m-text">那天发生了什么</Label>
					<Textarea id="m-text" bind:value={draft.text} rows={4} maxlength={600} disabled={busy} />
				</div>
				<fieldset class="min-w-0" disabled={busy}>
					<legend class="mb-2 text-sm font-medium">照片</legend>
					<div class="flex flex-wrap gap-2">
						{#each draft.photos as p, i}
							<div class="relative size-20 overflow-hidden rounded-lg bg-muted">
								<img src={"preview" in p ? p.preview : fileUrl(p.asset)} alt={"file" in p ? p.file.name : ""} class="size-full object-cover" />
								<Button variant="surface" class="photo-remove" aria-label={`移除${photoName(draft.title, i)}`} onclick={() => removePreview(i)}><X aria-hidden="true" /></Button>
							</div>
						{/each}
						<Button variant="outline" aria-describedby="m-formats" onclick={() => fileInput?.click()} class="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-sea hover:text-sea">
							<ImagePlus class="size-5" />加照片
						</Button>
						<Input bind:ref={fileInput} type="file" accept="image/*" multiple class="hidden" onchange={onFiles} />
					</div>
					<p id="m-formats" class="mt-2 text-xs text-muted-foreground">JPG、PNG 等浏览器可读取的图片</p>
				</fieldset>
				{#if message}<p class="text-sm" role="status">{message}</p>{/if}
				{#if failed.length}
					<ul class="grid gap-1 text-sm text-muted-foreground" aria-label="未上传的照片">
						{#each failed as item}<li class="break-words"><b>{item.name}</b>：{item.error.message}</li>{/each}
					</ul>
				{/if}
				{#if removedCount}<p class="text-sm">保存后将删除 {removedCount} 张原有照片，无法撤销。</p>{/if}
				{#if savedRecord}{@render deleteMemoryButton(savedRecord)}{/if}
				<Dialog.Footer class="gap-2">
					<Button variant="outline" disabled={busy} onclick={closeEditor}>{onlyRejected ? "完成" : hasFailures ? "放弃未保存内容" : "取消"}</Button>
					{#if !onlyRejected}<Button type="submit" disabled={busy}>{busy ? "保存中…" : saveFailed ? "重试保存" : retryable ? "重试未上传照片" : "保存回忆"}</Button>{/if}
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	{/if}
</Dialog.Root>
