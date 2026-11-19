<script lang="ts">
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { deletePhoto, uploadPhoto } from "$lib/upload";
	import { readLocal, writeLocal } from "$lib/local";
	import { fmtCN, todayKey } from "$lib/dates";
	import { WHO, otherOf, type Diary, type DiarySide, type Doc, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import ImagePlus from "@lucide/svelte/icons/image-plus";
	import X from "@lucide/svelte/icons/x";

	let {
		open = $bindable(false),
		date: initialDate = todayKey(),
		onsaved,
	}: { open?: boolean; date?: string; onsaved?: (both: boolean) => void } = $props();

	const diary = useCollection("diary");
	const me = $derived(session.who as Who);

	interface Draft {
		date: string;
		kind: Diary["kind"];
		title: string;
		place: string;
		text: string;
		fav: string;
		at: number;
	}
	const draftKey = (item: Doc<Diary> | null, who: Who) => `dydraft:${item ? item.id : "new"}:${who}`;
	const hasWords = (d: Partial<Draft> | null, isNew: boolean) =>
		!!(d && ((d.text ?? "").trim() || (d.fav ?? "").trim() || (isNew && (d.title ?? "").trim())));

	function byDate(k: string) {
		return diary.docs.filter((d) => d.data.date === k).sort((a, b) => a.data.c - b.data.c)[0] ?? null;
	}

	let item = $state<Doc<Diary> | null>(null);
	let f = $state<Draft>({ date: "", kind: "apart", title: "", place: "", text: "", fav: "", at: 0 });
	let photo = $state<{ id: string; file: File | null; url: string }>({ id: "", file: null, url: "" });
	let restored = $state(false);
	let autoMsg = $state("边写边自动存草稿");
	let err = $state("");
	let busy = $state(false);
	let fileInput: HTMLInputElement;

	function load(it: Doc<Diary> | null, date: string) {
		item = it;
		const side = it?.data[me];
		f = {
			date: it?.data.date ?? date,
			kind: it?.data.kind ?? "apart",
			title: it?.data.title ?? "",
			place: side?.pl ?? (me === "jq" && it?.data.place && !it.data.yi?.pl ? it.data.place : ""),
			text: side?.t ?? "",
			fav: side?.fav ?? "",
			at: 0,
		};
		if (photo.url) URL.revokeObjectURL(photo.url);
		photo = { id: side?.photo ?? "", file: null, url: "" };
		const dr = readLocal<Draft>(draftKey(it, me));
		restored = false;
		if (dr && hasWords(dr, !it) && (!it || !dr.date || dr.date === it.data.date)) {
			f = { ...f, text: dr.text ?? "", fav: dr.fav ?? "", place: dr.place || f.place };
			if (!it) f = { ...f, date: dr.date || f.date, title: dr.title ?? "", kind: dr.kind ?? f.kind };
			restored = true;
		}
		autoMsg = "边写边自动存草稿";
		err = "";
	}

	// 打开时加载那天的日记（没有就是新的一篇）
	let wasOpen = false;
	$effect(() => {
		const o = open;
		untrack(() => {
			if (o && !wasOpen) load(byDate(initialDate), initialDate);
			if (!o && wasOpen) saveDraft();
			wasOpen = o;
		});
	});

	function saveDraft(): boolean {
		const key = draftKey(item, me);
		if (hasWords(f, !item)) {
			if (writeLocal(key, { ...f, at: Date.now() })) {
				autoMsg = `草稿已自动保存 · ${new Date().toTimeString().slice(0, 5)}`;
				return true;
			}
			return false;
		}
		writeLocal(key, null);
		return false;
	}
	let timer = 0;
	function onInput() {
		clearTimeout(timer);
		timer = window.setTimeout(saveDraft, 500);
	}

	function onDateChange() {
		const ex = byDate(f.date);
		if (ex && ex.id !== item?.id) {
			saveDraft();
			load(ex, f.date);
			toast(`这天已经有日记了，帮你打开了 ${WHO[me]} 的那一边`);
		} else if (!ex && item) {
			saveDraft();
			const d = f.date;
			load(null, d);
			f.date = d;
		} else saveDraft();
	}

	function discard() {
		writeLocal(draftKey(item, me), null);
		load(item, f.date);
		restored = false;
		toast("草稿已丢掉");
	}

	function pickPhoto(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const file = el.files?.[0];
		el.value = "";
		if (!file) return;
		if (photo.url) URL.revokeObjectURL(photo.url);
		photo = { id: "", file, url: URL.createObjectURL(file) };
	}
	function clearPhoto() {
		if (photo.url) URL.revokeObjectURL(photo.url);
		photo = { id: "", file: null, url: "" };
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const text = f.text.trim();
		const fav = f.fav.trim();
		const title = f.title.trim();
		if (!f.date) return (err = "选一下日期");
		if (!text && !fav && !photo.id && !photo.file) return (err = "写一句话再保存");
		if (f.kind === "together" && !title && !item?.data.title) return (err = "见面的一天要写一下是哪次约会");
		busy = true;
		let photoId = photo.id;
		try {
			if (photo.file) {
				err = "正在上传照片…";
				photoId = await uploadPhoto(photo.file);
			}
		} catch {
			busy = false;
			return (err = "照片没传上去，可以换一张试试");
		}
		const side: DiarySide = { t: text.slice(0, 800), fav: fav.slice(0, 80), photo: photoId, pl: f.place.trim().slice(0, 40) };
		const patch: Partial<Diary> = { date: f.date, kind: f.kind, [me]: side };
		if (title || !item) patch.title = title.slice(0, 40);
		if (item?.data.place && me === "jq" && side.pl === item.data.place) patch.place = "";
		const oldPhoto = item?.data[me]?.photo ?? "";
		const other = otherOf(me);
		const both = !!item && !!(item.data[other]?.t || item.data[other]?.fav || item.data[other]?.photo);
		try {
			if (item) await diary.update(item.id, patch);
			else {
				const empty: DiarySide = { t: "", fav: "", photo: "" };
				await diary.add({ c: Date.now(), yi: empty, jq: empty, title: "", ...patch } as Diary);
			}
			if (oldPhoto && oldPhoto !== photoId) deletePhoto(oldPhoto);
			writeLocal(draftKey(item, me), null);
			writeLocal(draftKey(null, me), null);
			err = "";
			open = false;
			wasOpen = false;
			toast.success(both ? "日记已发布，两扇窗都打开啦 ♥" : `保存好了，另一边留给 ${WHO[other]}`);
			onsaved?.(both);
		} catch {
			err = "没保存上，再试一次";
		} finally {
			busy = false;
		}
	}

	async function removeAll() {
		if (!item) return;
		const it = item;
		try {
			await diary.remove(it.id);
			for (const w of ["yi", "jq"] as const) {
				writeLocal(draftKey(it, w), null);
				if (it.data[w]?.photo) deletePhoto(it.data[w].photo);
			}
			open = false;
			wasOpen = false;
			toast("已删除");
		} catch {
			err = "没删掉，再试一次";
		}
	}

	function keepDraft() {
		if (saveDraft()) {
			toast("草稿已保存，下次打开会自动恢复");
			open = false;
		} else toast("还没写内容");
	}

	const apart = $derived(f.kind === "apart");
	const otherWrote = $derived(!!item && !!(item.data[otherOf(me)]?.t || item.data[otherOf(me)]?.fav));
	const photoSrc = $derived(photo.url || (photo.id ? fileUrl(photo.id) : ""));
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title class="font-display text-xl">{item ? fmtCN(item.data.date) : "写下这一天"}</Dialog.Title>
			<Dialog.Description>
				你在写 {WHO[me]} 的这一边{otherWrote ? `，${WHO[otherOf(me)]} 已经写好了` : ""}
			</Dialog.Description>
		</Dialog.Header>

		{#if restored}
			<div class="flex items-center justify-between gap-2 rounded-xl bg-sand px-3 py-2 text-sm text-sand-ink">
				已恢复上次没写完的草稿
				<Button variant="ghost" size="xs" onclick={discard}>丢掉草稿</Button>
			</div>
		{/if}

		<form onsubmit={submit} oninput={onInput} class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
				<div class="flex flex-col gap-1.5">
					<Label for="dy-date">日期</Label>
					<Input id="dy-date" type="date" bind:value={f.date} onchange={onDateChange} required />
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-sm font-medium">这一天</span>
					<div class="grid grid-cols-2 rounded-full bg-muted p-1" role="radiogroup" aria-label="这一天是">
						{#each [["apart", "各自的一天"], ["together", "见面的一天"]] as const as [k, label] (k)}
							<button
								type="button"
								role="radio"
								aria-checked={f.kind === k}
								onclick={() => {
									f.kind = k;
									saveDraft();
								}}
								class={cn("h-8 rounded-full text-sm font-medium", f.kind === k ? "bg-card shadow-sm" : "text-muted-foreground")}
							>
								{label}
							</button>
						{/each}
					</div>
				</div>
			</div>
			<p class="-mt-2 text-xs text-muted-foreground">
				{apart ? "只写一句话就能保存，标题、地点和照片都可以不填。" : "写下这次约会，标题必填。"}
			</p>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="flex flex-col gap-1.5">
					<Label for="dy-title">{apart ? "标题（可选）" : "这次约会"}</Label>
					<Input id="dy-title" bind:value={f.title} maxlength={40} placeholder={apart ? "比如：考前的一天" : "比如：Doheny 海滩烧烤"} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="dy-place">我在哪（可选）</Label>
					<Input id="dy-place" bind:value={f.place} maxlength={40} placeholder="比如：UCLA 宿舍" />
				</div>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="dy-text">{apart ? "今天的一句话" : "我的心得"}</Label>
				<Textarea id="dy-text" bind:value={f.text} rows={apart ? 3 : 5} maxlength={800} placeholder={apart ? "一句话就可以，比如：今天好想你" : "今天最开心的是…"} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="dy-fav">最喜欢的瞬间（可选）</Label>
				<Input id="dy-fav" bind:value={f.fav} maxlength={80} />
			</div>
			<div class="flex items-center gap-3">
				{#if photoSrc}
					<div class="relative size-20 overflow-hidden rounded-lg">
						<img src={photoSrc} alt="" class="size-full object-cover" />
						<button type="button" class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white" aria-label="移除照片" onclick={clearPhoto}><X class="size-3.5" /></button>
					</div>
				{/if}
				<Button variant="outline" size="sm" class="rounded-full" onclick={() => fileInput.click()}><ImagePlus />{photoSrc ? "换一张" : "加一张照片"}</Button>
				<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={pickPhoto} />
			</div>

			<p class="text-xs text-muted-foreground" role="status">{err || autoMsg}</p>

			<Dialog.Footer class="flex-wrap gap-2">
				{#if item}<ConfirmButton variant="outline" class="mr-auto" confirmLabel="确定删除整篇？" onconfirm={removeAll}>删除整篇</ConfirmButton>{/if}
				<Button variant="ghost" onclick={keepDraft}>存草稿</Button>
				<Button type="submit" disabled={busy}>{busy ? "保存中…" : "发布"}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
