<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import TravelCard from "./TravelCard.svelte";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { AREA, GUIDE } from "$lib/data/content";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { photoErrorMessage, uploadPhoto } from "$lib/upload";
	import { heartBurst } from "$lib/fx";
	import { spotKey } from "$lib/spots";
	import { cn } from "$lib/utils";
	import type { SpotState } from "$lib/types";
	import Check from "@lucide/svelte/icons/check";
	import ImagePlus from "@lucide/svelte/icons/image-plus";

	let {
		name,
		area,
		type,
		desc,
		tip,
		q,
		onedit,
	}: {
		name: string;
		area: string;
		type: string;
		desc: string;
		tip: string;
		q: string;
		onedit?: () => void;
	} = $props();

	const spots = useCollection("spots");
	const key = $derived(spotKey(name));
	const spot = $derived<SpotState>(spots.get(key)?.data ?? { n: name, p: [], d: [] });
	const guide = $derived(Object.hasOwn(GUIDE, name) ? GUIDE[name] : undefined);
	const caps = $derived(guide?.caps ?? [1, 2, 3].map((n) => ({ label: `照片 ${n}` })));
	const doneCount = $derived(guide ? guide.steps.filter((_, i) => spot.d?.[i]).length : 0);

	function save(next: { p?: string[]; d?: number[] }) {
		const p = [0, 1, 2].map((i) => (next.p ?? spot.p)?.[i] ?? "");
		const d = (next.d ?? spot.d ?? []).slice(0, 8).map((x) => (x ? 1 : 0));
		return spots.set(key, { n: name, p, d, by: session.who ?? "", c: Date.now() });
	}

	async function toggleStep(i: number, el: HTMLElement) {
		const d = [...(spot.d ?? [])];
		d[i] = d[i] ? 0 : 1;
		if (d[i]) heartBurst(el);
		await save({ d }).catch(() => toast.error("没存上，再试一次"));
	}

	let input = $state<HTMLInputElement | null>(null);
	let slot = $state(0);
	let busy = $state<number | null>(null);
	let viewing = $state<number | null>(null);
	let lbOpen = $state(false);

	function clickSlot(i: number) {
		if (spot.p?.[i]) {
			viewing = i;
			lbOpen = true;
		} else {
			slot = i;
			input?.click();
		}
	}
	async function onFile(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		(e.currentTarget as HTMLInputElement).value = "";
		if (!f) return;
		const i = slot;
		busy = i;
		try {
			const id = await uploadPhoto(f);
			const p = [...(spot.p ?? [])];
			p[i] = id;
			await save({ p });
			toast.success("照片放好啦");
		} catch (error) {
			toast.error(photoErrorMessage(error));
		} finally {
			busy = null;
		}
	}
	async function removePhoto() {
		if (viewing === null) return;
		const p = [...(spot.p ?? [])];
		p[viewing] = "";
		lbOpen = false;
		await save({ p }).then(
			() => toast("这张拿掉了"),
			() => toast.error("没存上，再试一次"),
		);
	}
	function swapPhoto() {
		if (viewing === null) return;
		slot = viewing;
		lbOpen = false;
		input?.click();
	}
	const TILTS = ["-rotate-3", "rotate-2", "-rotate-1"];
</script>

<TravelCard {name} meta={[AREA[area as keyof typeof AREA], type]} {desc} {q} wish={name} cat="place" {onedit}
	summary={guide ? `照片与攻略${spots.ready || spots.get(key) ? ` · 已完成 ${doneCount}/${guide.steps.length}` : ""}` : tip ? "照片与贴士" : "地点照片"}>
	{#if tip}<p class="rounded-xl bg-sand px-3 py-2 text-[13px] text-sand-ink">{tip}</p>{/if}
	<Input bind:ref={input} type="file" accept="image/*" class="hidden" onchange={onFile} />
	<div class="mb-1 grid grid-cols-3 gap-2.5 px-1 pt-1">
		{#each [0, 1, 2] as i (i)}
			{@const id = spot.p?.[i]}
			<Button
				variant="surface"
				onclick={() => clickSlot(i)}
				class={cn("polaroid p-1.5 pb-2 transition-transform hover:-translate-y-0.5 hover:rotate-0", TILTS[i])}
				disabled={busy !== null || !spots.ready}
				aria-label={`${name} · ${caps[i]?.label}，${id ? "看大图" : "加照片"}`}
			>
				<span class="relative block aspect-[5/4] overflow-hidden bg-muted">
					{#if busy === i}
						<span class="flex size-full items-center justify-center text-[11px] text-[#5b6779]">上传中…</span>
					{:else if id}
						<img src={fileUrl(id)} alt={caps[i]?.label} loading="lazy" class="size-full object-cover" />
					{:else}
						<span aria-hidden="true" class="grid size-full place-items-center text-muted-foreground"><ImagePlus class="size-5" /></span>
					{/if}
				</span>
				<span class="mt-1 block truncate text-center text-[11px] text-[#5b6779]">{guide || id ? caps[i]?.label : "加照片"}</span>
			</Button>
		{/each}
	</div>

	{#if guide}
		<section class="rounded-2xl bg-muted/60 p-3.5">
			<h3 class="text-sm font-semibold">小攻略</h3>
			<ol class="mt-2 flex flex-col gap-1">
				{#each guide.steps as s, i (i)}
					{@const on = !!spot.d?.[i]}
					<li>
						<Button
							variant="surface"
							aria-pressed={on}
							disabled={!spots.ready}
							onclick={(e) => toggleStep(i, e.currentTarget)}
							class="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm hover:bg-background/60"
						>
							<span class={cn("mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-md border-2", on ? "border-sea bg-sea text-white" : "border-input bg-card")}>
								{#if on}<Check class="size-3" strokeWidth={3} />{/if}
							</span>
							<span class={cn(on && "text-muted-foreground line-through")}>{s}</span>
						</Button>
					</li>
				{/each}
			</ol>
			<div class="mt-3 flex flex-col gap-1 border-t pt-3 text-[13px] text-muted-foreground">
				<span><b class="mr-2 font-semibold text-foreground">带上</b>{guide.bring}</span>
				<span><b class="mr-2 font-semibold text-foreground">顺路吃</b>{guide.eat}</span>
			</div>
		</section>
	{/if}
</TravelCard>

{#if viewing !== null && spot.p?.[viewing]}
	<Lightbox bind:open={lbOpen} src={fileUrl(spot.p[viewing])} alt={name} title={`${name} · ${caps[viewing]?.label ?? ""}`}>
		<Button variant="outline" size="sm" class="rounded-full" onclick={swapPhoto}>换一张</Button>
		<ConfirmButton variant="outline" class="rounded-full" confirmLabel="确认移除" description={`从「${name}」的「${caps[viewing]?.label}」移除这张照片？`} onconfirm={removePhoto}>移除照片</ConfirmButton>
	</Lightbox>
{/if}
