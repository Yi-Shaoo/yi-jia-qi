<script lang="ts">
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import Polaroid from "$lib/components/Polaroid.svelte";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as Dialog from "$lib/components/ui/dialog";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { deletePhoto, uploadPhoto } from "$lib/upload";
	import { filmStamp, fmtDots, isDateKey, todayKey } from "$lib/dates";
	import type { Doc, Memory } from "$lib/types";
	import Plus from "@lucide/svelte/icons/plus";
	import X from "@lucide/svelte/icons/x";
	import ImagePlus from "@lucide/svelte/icons/image-plus";

	const memories = useCollection("memories");
	const list = $derived(
		memories.docs
			.filter((d) => isDateKey(d.data.date) && typeof d.data.title === "string")
			.sort((a, b) => (a.data.date < b.data.date ? -1 : a.data.date > b.data.date ? 1 : (a.data.c ?? 0) - (b.data.c ?? 0))),
	);

	// —— 看大图 ——
	let lb = $state<{ mem: Doc<Memory>; photo: string } | null>(null);
	let lbOpen = $state(false);
	async function removePhotoFromMemory() {
		if (!lb) return;
		const { mem, photo } = lb;
		lbOpen = false;
		try {
			await memories.update(mem.id, { photos: mem.data.photos.filter((p) => p !== photo) });
			deletePhoto(photo);
			toast("照片已删除");
		} catch {
			toast.error("没删掉，再试一次");
		}
	}

	// —— 编辑 ——
	let edOpen = $state(false);
	let editing = $state<Doc<Memory> | null>(null);
	let f = $state({ date: "", title: "", text: "" });
	let keep = $state<string[]>([]);
	let adds = $state<{ file: File; url: string }[]>([]);
	let err = $state("");
	let busy = $state(false);
	let fileInput: HTMLInputElement;

	function openEditor(item: Doc<Memory> | null) {
		editing = item;
		f = { date: item?.data.date ?? todayKey(), title: item?.data.title ?? "", text: item?.data.text ?? "" };
		keep = item ? [...(item.data.photos ?? [])] : [];
		adds.forEach((a) => URL.revokeObjectURL(a.url));
		adds = [];
		err = "";
		edOpen = true;
	}
	function onFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		input.value = "";
		adds = [...adds, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))];
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (!f.date) return (err = "选一下日期");
		if (!f.title.trim()) return (err = "写一个标题");
		busy = true;
		const ids = [...keep];
		let bad = 0;
		for (let i = 0; i < adds.length; i++) {
			err = `正在上传照片 ${i + 1} / ${adds.length}…`;
			try {
				ids.push(await uploadPhoto(adds[i].file));
			} catch {
				bad++;
			}
		}
		const data = {
			date: f.date,
			title: f.title.trim().slice(0, 40),
			text: f.text.trim().slice(0, 600),
			photos: ids,
			dlabel: editing && editing.data.date === f.date ? (editing.data.dlabel ?? "") : "",
		};
		try {
			if (editing) await memories.update(editing.id, data);
			else await memories.add({ ...data, c: Date.now() });
			(editing?.data.photos ?? []).filter((p) => !ids.includes(p)).forEach(deletePhoto);
			toast.success(bad ? `已保存，有 ${bad} 张照片没传上去（可能是 HEIC 格式）` : "已保存");
			adds.forEach((a) => URL.revokeObjectURL(a.url));
			adds = [];
			edOpen = false;
			err = "";
		} catch {
			err = "没保存上，再试一次";
		} finally {
			busy = false;
		}
	}

	async function removeMemory(m: Doc<Memory>) {
		try {
			await memories.remove(m.id);
			(m.data.photos ?? []).forEach(deletePhoto);
			toast("已删除");
			edOpen = false;
		} catch {
			toast.error("没删掉，再试一次");
		}
	}
</script>

<PageHeader eyebrow="Our timeline" title="我们的回忆" lede="按日期排好的每一站。写下那天的事、配上照片，两个人都能看到。">
	{#snippet actions()}
		<Button class="rounded-full" onclick={() => openEditor(null)}><Plus />添加一段回忆</Button>
	{/snippet}
</PageHeader>

{#if memories.status === "loading"}
	<p class="text-muted-foreground">正在加载…</p>
{:else}
	<ol class="relative flex flex-col gap-10 pl-8 md:pl-12">
		<span class="absolute top-2 bottom-0 left-[11px] w-0.5 bg-border md:left-[19px]" aria-hidden="true"></span>
		{#if !list.length}
			<li class="text-muted-foreground">还没有回忆，点上面的按钮写下第一段。</li>
		{/if}
		{#each list as m, idx (m.id)}
			<li class="relative">
				<span
					class="absolute top-1.5 -left-[27px] size-3 rounded-full shadow-[0_0_0_4px_var(--background)] md:-left-[35px] md:size-3.5"
					style:background={["var(--coral)", "var(--sea)", "var(--sun)"][idx % 3]}
					aria-hidden="true"
				></span>
				<div class="font-mono text-xs text-muted-foreground">{m.data.dlabel || fmtDots(m.data.date)}</div>
				<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
					<h2 class="text-2xl font-bold">{m.data.title}</h2>
					<Button variant="ghost" size="xs" class="rounded-full text-muted-foreground" onclick={() => openEditor(m)}>编辑</Button>
				</div>
				{#if m.data.text}<p class="mt-1 max-w-2xl text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">{m.data.text}</p>{/if}
				{#if m.data.photos?.length}
					<div class="mt-4 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
						{#each m.data.photos as p, i (p)}
							<Polaroid
								src={fileUrl(p)}
								alt={m.data.title}
								stamp={i === 0 && !m.data.dlabel ? filmStamp(m.data.date) : ""}
								tilt={[-2, 1.5, -1, 2][i % 4]}
								imgClass="aspect-[4/5] h-auto"
								class="p-2 pb-3"
								onclick={() => {
									lb = { mem: m, photo: p };
									lbOpen = true;
								}}
							/>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
		<li class="relative">
			<span class="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-dashed border-muted-foreground bg-background md:-left-[35px]" aria-hidden="true"></span>
			<div class="font-mono text-xs text-muted-foreground">接下来</div>
			<h2 class="mt-1 text-2xl font-bold">第一个感恩节和圣诞节</h2>
			<p class="mt-1 text-muted-foreground">写在<a href="/wish" class="text-sea">心愿清单</a>里，一起去完成。</p>
		</li>
	</ol>
{/if}

{#if lb}
	<Lightbox bind:open={lbOpen} src={fileUrl(lb.photo)} alt={lb.mem.data.title} title={lb.mem.data.title}>
		<ConfirmButton variant="outline" class="rounded-full" confirmLabel="确定删除？" onconfirm={removePhotoFromMemory}>从这段回忆里删掉这张</ConfirmButton>
	</Lightbox>
{/if}

<Dialog.Root bind:open={edOpen}>
	<Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-display text-xl">{editing ? "编辑回忆" : "添加一段回忆"}</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={save} class="flex flex-col gap-4">
			<div class="grid grid-cols-[150px_1fr] gap-3">
				<div class="flex flex-col gap-1.5"><Label for="m-date">日期</Label><Input id="m-date" type="date" bind:value={f.date} required /></div>
				<div class="flex flex-col gap-1.5"><Label for="m-title">标题</Label><Input id="m-title" bind:value={f.title} maxlength={40} placeholder="比如：Doheny 海滩烧烤" /></div>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="m-text">那天发生了什么</Label>
				<Textarea id="m-text" bind:value={f.text} rows={4} maxlength={600} />
			</div>
			<div class="flex flex-col gap-2">
				<Label>照片</Label>
				<div class="flex flex-wrap gap-2">
					{#each keep as p, i (p)}
						<div class="relative size-20 overflow-hidden rounded-lg">
							<img src={fileUrl(p)} alt="" class="size-full object-cover" />
							<button type="button" class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white" aria-label="移除这张" onclick={() => (keep = keep.filter((_, j) => j !== i))}><X class="size-3.5" /></button>
						</div>
					{/each}
					{#each adds as a, i (a.url)}
						<div class="relative size-20 overflow-hidden rounded-lg">
							<img src={a.url} alt="" class="size-full object-cover" />
							<button type="button" class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white" aria-label="移除这张" onclick={() => { URL.revokeObjectURL(a.url); adds = adds.filter((_, j) => j !== i); }}><X class="size-3.5" /></button>
						</div>
					{/each}
					<button type="button" onclick={() => fileInput.click()} class="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-sea hover:text-sea">
						<ImagePlus class="size-5" />加照片
					</button>
					<input bind:this={fileInput} type="file" accept="image/*" multiple class="hidden" onchange={onFiles} />
				</div>
			</div>
			{#if err}<p class="text-sm text-muted-foreground" role="status">{err}</p>{/if}
			<Dialog.Footer class="gap-2">
				{#if editing}{@const ed = editing}<ConfirmButton variant="outline" class="mr-auto" onconfirm={() => removeMemory(ed)}>删除这段</ConfirmButton>{/if}
				<Button variant="outline" onclick={() => (edOpen = false)}>取消</Button>
				<Button type="submit" disabled={busy}>{busy ? "保存中…" : "保存"}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
