<script lang="ts">
	import { onDestroy, untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { RadioChoice } from "$lib/components/ui/radio-choice";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { deletePhoto, photoErrorMessage, uploadPhoto } from "$lib/upload";
	import { fmtTime } from "$lib/dates";
	import { WHO, otherOf } from "$lib/types";
	import { deletionDescription, diaryFields, diaryTitle, invalidField, publication, savedPhotos, sideHasContent, textChanges, type DiaryFields } from "./entry";
	import { clearTextDraft, entryDraftKey, saveTextDraft, type EditorTarget } from "./drafts";
	import ImagePlus from "@lucide/svelte/icons/image-plus";
	import X from "@lucide/svelte/icons/x";

	let { target, onclose, onsaved }: { target: EditorTarget; onclose: () => void; onsaved: () => void } = $props();
	const { who, item, date, key, draft } = untrack(() => target);
	const diary = useCollection("diary");
	const other = otherOf(who);
	const base = diaryFields(item?.data, who, date);
	const initial = { ...base, ...draft?.fields };
	const changesOf = (fields: DiaryFields) => textChanges(base, fields, !item);
	const live = $derived(item ? diary.get(item.id) : undefined);
	const missing = $derived(!!item && !live);

	let f = $state<DiaryFields>({ ...initial });
	const anotherOnDate = $derived(!item && !!f.date && diary.docs.some((d) => d.data.date === f.date));
	let open = $state(true);
	let active = true;
	let busy = $state<"upload" | "publish" | "delete" | null>(null);
	let invalid = $state<ReturnType<typeof invalidField>>(null);
	let err = $state("");
	let restored = $state(!!draft);
	let savedAt = $state(draft?.at || 0);
	let lastSaved = JSON.stringify(changesOf(initial));
	let draftError = $state("");
	let fileInput = $state<HTMLInputElement | null>(null);
	let bodyInput = $state<HTMLTextAreaElement | null>(null);
	let viewportHeight = $state("100dvh"), viewportCenter = $state("50%");
	$effect(() => {
		const viewport = window.visualViewport;
		if (!viewport) return;
		function fit() {
			if (!viewport) return;
			viewportHeight = `${viewport.height}px`;
			viewportCenter = `${viewport.offsetTop + viewport.height / 2}px`;
		}
		fit();
		viewport.addEventListener("resize", fit);
		viewport.addEventListener("scroll", fit);
		return () => {
			viewport.removeEventListener("resize", fit);
			viewport.removeEventListener("scroll", fit);
		};
	});
	let file = $state.raw<File | null>(null);
	let preview = $state("");
	let removedPhoto = $state(false);
	let uploadedId = "";
	const savedPhoto = $derived(live?.data[who]?.photo ?? "");
	const photoSrc = $derived(preview || (!removedPhoto && !file && savedPhoto ? fileUrl(savedPhoto) : ""));
	const photoChanged = $derived(!!file || removedPhoto);

	$effect(() => {
		if (!file) { preview = ""; return; }
		const url = URL.createObjectURL(file);
		preview = url;
		return () => URL.revokeObjectURL(url);
	});

	function persist(fields: DiaryFields): boolean {
		const changes = changesOf(fields);
		const serialized = JSON.stringify(changes);
		if (serialized !== lastSaved || draftError) {
			const at = Date.now();
			const ok = changes ? saveTextDraft(key, changes, at) : clearTextDraft(key);
			if (!ok) {
				draftError = changes ? "没能保存本机文字草稿。关闭前请复制文字，或直接发布。" : "没能清除本机文字草稿。";
				return false;
			}
			lastSaved = serialized;
			savedAt = changes ? at : 0;
			restored = false;
			draftError = "";
		}
		return true;
	}

	$effect(() => {
		const fields = { ...f };
		untrack(() => { if (active) persist(fields); });
	});
	onDestroy(() => { active = false; });

	function finish() {
		if (!active) return;
		active = false;
		onclose();
	}

	function closeEditor(next: boolean) {
		if (next) return;
		if (busy || !persist(f)) { open = true; return; }
		if (photoChanged) toast("照片变更未保存");
		finish();
	}

	function discard() {
		if (!clearTextDraft(key)) { draftError = "没能清除本机文字草稿。"; return; }
		lastSaved = "null";
		f = { ...base };
		restored = false;
		savedAt = 0;
		draftError = "";
		invalid = null;
		err = "";
		toast("文字草稿已丢掉");
	}

	function pickPhoto(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const picked = input.files?.[0];
		input.value = "";
		if (!picked) return;
		file = picked;
		removedPhoto = false;
		uploadedId = "";
		invalid = null;
		err = "";
	}

	function clearPhoto() {
		file = null;
		removedPhoto = !!savedPhoto;
		uploadedId = "";
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (busy || !diary.ready || missing) return;
		const form = { ...f };
		invalid = invalidField(form, !!file || (!removedPhoto && !!savedPhoto));
		if (invalid) {
			document.getElementById(`dy-${invalid}`)?.focus();
			return;
		}
		err = "";
		busy = file && !uploadedId ? "upload" : "publish";
		try {
			if (file && !uploadedId) uploadedId = await uploadPhoto(file);
			if (!active || !diary.ready) return;
			busy = "publish";
			const current = item ? diary.get(item.id) : undefined;
			if (item && !current) return;
			const { fields, side, patch, entry } = publication(base, form, who, current?.data, file ? uploadedId : removedPhoto ? "" : undefined);
			if (invalidField(fields, !!side.photo)) {
				err = "日记已在别处更改，请重新打开后再发布。";
				return;
			}
			const previousPhoto = current?.data[who]?.photo;
			const saved = item ? await diary.update(item.id, patch) : await diary.add(entry);
			if (previousPhoto && !savedPhotos(saved.data).includes(previousPhoto)) void deletePhoto(previousPhoto);
			const cleared = clearTextDraft(key, true);
			finish();
			toast.success(sideHasContent(saved.data[other]) ? "日记已发布，两边都写好了" : `日记已发布，另一边留给 ${WHO[other]}`);
			if (!cleared) toast.warning("日记已发布，但没能清除本机草稿");
			onsaved();
		} catch (e) {
			err = busy === "upload" ? photoErrorMessage(e) : "没能发布日记，内容还在，请重试。";
		} finally {
			busy = null;
		}
	}

	async function removeAll() {
		if (busy || !diary.ready || !live) return;
		const { id, data } = live;
		busy = "delete";
		err = "";
		try {
			await diary.remove(id);
			const cleared = (["yi", "jq"] as const).map((w) => clearTextDraft(entryDraftKey(id, w), true));
			for (const photoId of savedPhotos(data)) void deletePhoto(photoId);
			finish();
			toast.success("已删除整篇日记");
			if (cleared.includes(false)) toast.warning("没能清除本机对应的草稿");
		} catch {
			err = "没能删除这篇日记，请重试。";
		} finally {
			busy = null;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={closeEditor}>
	<Dialog.Content class="flex max-h-[calc(var(--editor-height)-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-[min(54rem,calc(100%-2rem))]" style={`--editor-height:${viewportHeight};top:${viewportCenter}`} showCloseButton={!busy}
		onOpenAutoFocus={(e) => { if (bodyInput) { e.preventDefault(); bodyInput.focus(); } }}
		onEscapeKeydown={(e) => { if (busy) e.preventDefault(); }} onInteractOutside={(e) => { if (busy) e.preventDefault(); }}>
		<Dialog.Header class="shrink-0 border-b px-4 py-4 pr-16 text-left sm:px-6 sm:pr-16">
			<Dialog.Title class="font-display text-xl break-words">{item ? diaryTitle(live?.data ?? item.data) : "新日记"}</Dialog.Title>
			{#if item}<Dialog.Description>{WHO[other]} 的这一边{sideHasContent(live?.data[other]) ? "已发布" : "还没写"}</Dialog.Description>{/if}
		</Dialog.Header>

		<form id="diary-publish" novalidate onsubmit={submit} oninput={() => { invalid = null; err = ""; }} class="grid min-h-0 min-w-0 content-start gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
			{#if restored}
				<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand px-3 py-2 text-sm text-sand-ink">
					<span role="status">已恢复文字草稿{savedAt ? ` · ${fmtTime(savedAt)}` : ""}</span>
					<Button variant="ghost" size="xs" disabled={!!busy} onclick={discard}>丢掉草稿</Button>
				</div>
			{/if}
			<CollectionNotice status={diary.status} retry={() => diary.load()} label="日记" />
			{#if missing && !busy}<p role="alert" class="text-sm text-destructive">这篇日记已不存在，无法发布改动。</p>{/if}
			{#snippet sharedFields()}
			<fieldset disabled={!!busy} class="grid min-w-0 content-start gap-4">
				<legend class="mb-3 font-display text-base font-semibold">两人共用</legend>
				<div class="grid min-w-0 gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] md:grid-cols-1">
					<div class="grid min-w-0 gap-1.5">
						<Label for="dy-date">日期</Label>
						<Input id="dy-date" type="date" bind:value={f.date} required aria-invalid={invalid === "date"} aria-describedby={invalid === "date" ? "dy-date-error" : undefined} />
						{#if invalid === "date"}<span id="dy-date-error" role="alert" class="text-xs text-destructive">请选择日记日期。</span>{/if}
					</div>
					<fieldset class="min-w-0">
						<legend class="mb-1.5 text-sm leading-none font-medium">日记类型</legend>
						<div class="grid grid-cols-2 rounded-full bg-muted p-1">
							{#each [["apart", "各自的一天"], ["together", "见面的一天"]] as const as [kind, label] (kind)}
								<RadioChoice name="dy-kind" variant="segment" value={kind} {label} bind:selected={f.kind} />
							{/each}
						</div>
					</fieldset>
				</div>
				{#if anotherOnDate}<p class="text-xs text-muted-foreground" role="status">这一天已有日记，发布会另存一篇。</p>{/if}
				<div class="grid gap-1.5">
					<Label for="dy-title">{f.kind === "together" ? "约会标题（必填）" : "标题"}</Label>
					<Input id="dy-title" bind:value={f.title} maxlength={40} required={f.kind === "together"} aria-invalid={invalid === "title"} aria-describedby={invalid === "title" ? "dy-title-error" : undefined} />
					{#if invalid === "title"}<span id="dy-title-error" role="alert" class="text-xs text-destructive">请填写约会标题。</span>{/if}
				</div>
			</fieldset>

			{/snippet}
			{#snippet personalFields()}
			<fieldset disabled={!!busy} aria-describedby="dy-rule" class="grid min-w-0 content-start gap-3">
				<legend class="mb-1 font-display text-base font-semibold">{WHO[who]} 的这一边</legend>
				<p id="dy-rule" role={invalid === "text" ? "alert" : undefined} class={invalid === "text" ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
					{invalid === "text" ? "还不能发布：" : ""}正文、瞬间或照片至少填一项。
				</p>
				<div class="grid gap-1.5">
					<Label for="dy-text">正文</Label>
					<Textarea id="dy-text" bind:ref={bodyInput} bind:value={f.text} class="field-sizing-fixed min-h-24 md:min-h-36" rows={3} maxlength={800} aria-invalid={invalid === "text"} aria-describedby="dy-rule" />
				</div>
				<div class={["grid min-w-0 gap-3", f.kind === "apart" && "sm:grid-cols-2"]}>
					<div class="grid gap-1.5">
						<Label for="dy-fav">最喜欢的瞬间</Label>
						<Input id="dy-fav" bind:value={f.fav} maxlength={80} />
					</div>
					{#if f.kind === "apart"}
						<div class="grid gap-1.5">
							<Label for="dy-place">我在哪</Label>
							<Input id="dy-place" bind:value={f.place} maxlength={40} />
						</div>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					{#if photoSrc}
						<div class="relative size-20 overflow-hidden rounded-lg">
							<img src={photoSrc} alt={`${WHO[who]} 的日记照片`} class="size-full object-cover" />
							<Button variant="surface" class="photo-remove" aria-label="移除照片" onclick={clearPhoto}><X aria-hidden="true" /></Button>
						</div>
					{/if}
					<Button variant="outline" size="sm" onclick={() => fileInput?.click()}><ImagePlus />{photoSrc ? "更换照片" : "加一张照片"}</Button>
					<Input bind:ref={fileInput} type="file" accept="image/*" aria-label="选择日记照片" class="hidden" onchange={pickPhoto} />
				</div>
				{#if photoChanged}
					<p class="text-xs text-muted-foreground">{file ? "草稿只存文字，发布时才上传照片。" : "草稿不保存照片变更，发布后才会移除照片。"}</p>
				{/if}
			</fieldset>
			{/snippet}

			<div class="grid min-w-0 items-start gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-6">
				{@render personalFields()}
				<div class="min-w-0 border-t pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
					{@render sharedFields()}
				</div>
			</div>
			{#if live}
				<div class="border-t pt-3">
					<ConfirmButton variant="ghost" class="text-destructive" disabled={!!busy || !diary.ready} description={deletionDescription(live.data)} confirmLabel="确认删除整篇日记" onconfirm={removeAll}>删除整篇</ConfirmButton>
				</div>
			{/if}
		</form>

		<div class="grid shrink-0 gap-2 border-t px-4 py-3 sm:px-6">
			{#if err}<p class="text-sm text-destructive" role="alert">{err}</p>{/if}
			{#if draftError}
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-sm text-destructive" role="alert">{draftError}</p>
					<Button variant="outline" size="sm" disabled={!!busy} onclick={finish}>不保存并关闭</Button>
				</div>
			{/if}
			<Dialog.Footer class="flex-row items-center justify-end">
				{#if !draftError && !restored}
					<p class="mr-auto text-xs text-muted-foreground" role="status">{savedAt ? `文字草稿已自动保存 · ${fmtTime(savedAt)}` : "文字自动保存到本机，下次打开时恢复。"}</p>
				{/if}
				<Button type="submit" form="diary-publish" disabled={!!busy || !diary.ready || missing}>{busy === "upload" ? "上传照片中…" : busy === "publish" ? "发布中…" : "发布"}</Button>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>
