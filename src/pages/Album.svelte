<script lang="ts">
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { deletePhoto, uploadPhoto } from "$lib/upload";
	import { filmStampTs } from "$lib/dates";
	import type { Doc, Photo, PhotoTag } from "$lib/types";
	import { cn } from "$lib/utils";
	import Upload from "@lucide/svelte/icons/upload";

	const photos = useCollection("photos");
	type F = "all" | "sea" | "trip" | "daily" | "none";
	const FILTERS: Record<F, string> = { all: "全部", sea: "海边", trip: "旅行", daily: "日常", none: "还没分类" };
	const TAGS: Record<Exclude<PhotoTag, "">, string> = { sea: "海边", trip: "旅行", daily: "日常" };
	let filter = $state<F>("all");

	const list = $derived(
		photos.docs
			.filter((d) => /^[0-9a-f]{32}$/.test(d.data.asset ?? ""))
			.filter((d) => filter === "all" || (filter === "none" ? !d.data.tag : d.data.tag === filter))
			.sort((a, b) => (b.data.c ?? 0) - (a.data.c ?? 0)),
	);

	let input: HTMLInputElement;
	let msg = $state("");
	async function onFiles(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const files = Array.from(el.files ?? []);
		el.value = "";
		let ok = 0,
			bad = 0;
		for (let i = 0; i < files.length; i++) {
			msg = `正在上传 ${i + 1} / ${files.length}…`;
			try {
				const asset = await uploadPhoto(files[i]);
				await photos.add({ asset, cap: "", c: Date.now(), tag: filter === "all" || filter === "none" ? "" : filter });
				ok++;
			} catch {
				bad++;
			}
		}
		msg = `上传了 ${ok} 张。${bad ? `${bad} 张没传上去（多半是 HEIC 格式，用手机直接上传或先导出成 JPG）。` : ""}`;
	}

	let cur = $state<Doc<Photo> | null>(null);
	let open = $state(false);
	let cap = $state("");
	function view(p: Doc<Photo>) {
		cur = p;
		cap = p.data.cap ?? "";
		open = true;
	}
	async function saveCap(e: SubmitEvent) {
		e.preventDefault();
		if (!cur) return;
		await photos.update(cur.id, { cap: cap.trim().slice(0, 40) }).then(
			() => toast.success("名字已保存"),
			() => toast.error("没保存上"),
		);
	}
	async function setTag(tag: PhotoTag) {
		if (!cur) return;
		cur = { ...cur, data: { ...cur.data, tag } };
		await photos.update(cur.id, { tag }).catch(() => toast.error("没保存上"));
	}
	async function remove() {
		if (!cur) return;
		const p = cur;
		open = false;
		try {
			await photos.remove(p.id);
			deletePhoto(p.data.asset);
			toast("已删除");
		} catch {
			toast.error("删除失败");
		}
	}
</script>

<PageHeader eyebrow="Album" title="情侣相册" lede="点照片可以放大、起名字、分类。手机上传会自动转成网页能显示的格式。">
	{#snippet actions()}
		<input bind:this={input} type="file" accept="image/*" multiple class="hidden" onchange={onFiles} />
		<Button class="rounded-full" onclick={() => input.click()}><Upload />上传照片</Button>
	{/snippet}
</PageHeader>

<div class="mb-5 flex flex-col gap-3">
	<FilterChips options={FILTERS} bind:value={filter} label="照片分类" />
	{#if msg}<p class="text-sm text-muted-foreground" role="status">{msg}</p>{/if}
</div>

{#if photos.status === "loading"}
	<p class="text-muted-foreground">正在加载…</p>
{:else if !list.length}
	<p class="rounded-2xl bg-card p-6 text-muted-foreground shadow-[0_0_0_1px_var(--border)]">这里还没有照片，点右上角上传第一张。</p>
{:else}
	<div class="columns-2 gap-4 md:columns-3 lg:columns-4">
		{#each list as p (p.id)}
			<button type="button" onclick={() => view(p)} class="polaroid mb-4 block w-full break-inside-avoid p-2 pb-3 text-left transition-transform hover:-translate-y-0.5">
				<span class="relative block">
					<img src={fileUrl(p.data.asset)} alt={p.data.cap || "照片"} loading="lazy" class="block w-full" />
					{#if p.data.st || p.data.c}<span class="film-stamp absolute right-2 bottom-2 text-[13px]">{p.data.st || filmStampTs(p.data.c)}</span>{/if}
				</span>
				{#if p.data.cap}<span class="mt-2 block truncate text-[13px] text-[#14253d]">{p.data.cap}</span>{/if}
			</button>
		{/each}
	</div>
{/if}

{#if cur}
	<Lightbox bind:open src={fileUrl(cur.data.asset)} alt={cur.data.cap || "照片"}>
		<form onsubmit={saveCap} class="flex w-full gap-2">
			<Input bind:value={cap} maxlength={40} placeholder="给这张照片起个名字" aria-label="照片名字" />
			<Button type="submit" variant="secondary">保存</Button>
		</form>
		<div class="flex flex-wrap gap-1.5">
			{#each Object.entries(TAGS) as [k, v] (k)}
				<button
					type="button"
					onclick={() => setTag(cur?.data.tag === k ? "" : (k as PhotoTag))}
					class={cn("h-8 rounded-full border px-3 text-sm", cur.data.tag === k ? "border-foreground bg-foreground text-background" : "hover:bg-muted")}
				>
					{v}
				</button>
			{/each}
		</div>
		<ConfirmButton variant="outline" class="ml-auto rounded-full" onconfirm={remove}>删除这张</ConfirmButton>
	</Lightbox>
{/if}
