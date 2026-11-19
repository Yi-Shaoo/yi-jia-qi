<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import MapButton from "$lib/components/MapButton.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import SpotArt from "$lib/components/SpotArt.svelte";
	import Lightbox from "$lib/components/Lightbox.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { AREA, GUIDE, SPOT_ICON, type ArtIcon } from "$lib/data/content";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { uploadPhoto } from "$lib/upload";
	import { heartBurst } from "$lib/fx";
	import { spotColorIndex, spotKey } from "$lib/spots";
	import { cn } from "$lib/utils";
	import type { SpotState } from "$lib/types";
	import Check from "@lucide/svelte/icons/check";
	import Pencil from "@lucide/svelte/icons/pencil";
	import ImageIcon from "@lucide/svelte/icons/images";

	let {
		name,
		area,
		type,
		desc,
		tip,
		q,
		mine = false,
		onedit,
	}: {
		name: string;
		area: string;
		type: string;
		desc: string;
		tip: string;
		q: string;
		mine?: boolean;
		onedit?: () => void;
	} = $props();

	const spots = useCollection("spots");
	const key = $derived(spotKey(name));
	const spot = $derived<SpotState>(spots.get(key)?.data ?? { n: name, p: [], d: [] });
	const guide = $derived(GUIDE[name]);
	const ci = $derived(spotColorIndex(name));
	const caps = $derived<{ label: string; icon: ArtIcon }[]>(
		guide?.caps ?? [
			{ label: "照片 1", icon: SPOT_ICON[type] ?? "heart" },
			{ label: "照片 2", icon: "heart" },
			{ label: "照片 3", icon: "star" },
		],
	);
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

	let input: HTMLInputElement;
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
			input.click();
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
		} catch {
			toast.error("照片没传上去，换一张试试");
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
		input.click();
	}
	const TILTS = ["-rotate-3", "rotate-2", "-rotate-1"];
</script>

<article class={cn("flex flex-col gap-3 rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--border)]", mine && "ring-2 ring-coral/30")}>
	<input bind:this={input} type="file" accept="image/*" class="hidden" onchange={onFile} />
	<div class="mb-1 grid grid-cols-3 gap-2.5 px-1 pt-1">
		{#each [0, 1, 2] as i (i)}
			{@const id = spot.p?.[i]}
			<button
				type="button"
				onclick={() => clickSlot(i)}
				class={cn("polaroid p-1.5 pb-2 transition-transform hover:-translate-y-0.5 hover:rotate-0", TILTS[i])}
				aria-label={id ? `${caps[i]?.label}，看大图` : `${caps[i]?.label}，放一张照片`}
			>
				<span class="relative block aspect-[5/4] overflow-hidden bg-muted">
					{#if busy === i}
						<span class="flex size-full items-center justify-center text-[11px] text-[#5b6779]">上传中…</span>
					{:else if id}
						<img src={fileUrl(id)} alt={caps[i]?.label} loading="lazy" class="size-full object-cover" />
					{:else}
						<SpotArt icon={caps[i]?.icon ?? "heart"} ci={ci + i} />
					{/if}
				</span>
				<span class="mt-1 block truncate text-center text-[11px] text-[#5b6779]">{caps[i]?.label}</span>
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap gap-1.5">
		{#if mine}<Badge class="bg-coral-soft text-coral">我们加的</Badge>{/if}
		{#if AREA[area as keyof typeof AREA]}<Badge variant="secondary">{AREA[area as keyof typeof AREA]}</Badge>{/if}
		{#if type}<Badge variant="outline">{type}</Badge>{/if}
	</div>
	<h3 class="text-xl font-bold">{name}</h3>
	{#if desc}<p class="text-[15px] leading-relaxed text-muted-foreground">{desc}</p>{/if}

	{#if guide}
		<div class="rounded-2xl bg-muted/60 p-4">
			<div class="mb-2 flex items-center justify-between text-sm font-semibold">
				小攻略<span class="text-xs font-normal text-muted-foreground">{doneCount ? `完成 ${doneCount}/${guide.steps.length}` : "一起打勾"}</span>
			</div>
			<ol class="flex flex-col gap-1">
				{#each guide.steps as s, i (i)}
					{@const on = !!spot.d?.[i]}
					<li>
						<button
							type="button"
							aria-pressed={on}
							onclick={(e) => toggleStep(i, e.currentTarget)}
							class="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm hover:bg-background/60"
						>
							<span class={cn("mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-md border-2", on ? "border-sea bg-sea text-white" : "border-input bg-card")}>
								{#if on}<Check class="size-3" strokeWidth={3} />{/if}
							</span>
							<span class={cn(on && "text-muted-foreground line-through")}>{s}</span>
						</button>
					</li>
				{/each}
			</ol>
			<div class="mt-3 flex flex-col gap-1 border-t pt-3 text-[13px] text-muted-foreground">
				<span><b class="mr-2 font-semibold text-foreground">带上</b>{guide.bring}</span>
				<span><b class="mr-2 font-semibold text-foreground">顺路吃</b>{guide.eat}</span>
			</div>
		</div>
	{/if}
	{#if tip}<p class="rounded-xl bg-sand px-3 py-2 text-[13px] text-sand-ink">💡 {tip}</p>{/if}

	<div class="mt-auto flex flex-wrap gap-2 pt-1">
		<MapButton {q} />
		<Button variant="outline" size="sm" class="rounded-full" href={`https://www.google.com/maps/search/${encodeURIComponent(q)}`} target="_blank" rel="noopener external"><ImageIcon />更多照片</Button>
		<WishButton text={name} />
		{#if onedit}<Button variant="ghost" size="sm" class="rounded-full" onclick={onedit}><Pencil />编辑</Button>{/if}
	</div>
</article>

{#if viewing !== null && spot.p?.[viewing]}
	<Lightbox bind:open={lbOpen} src={fileUrl(spot.p[viewing])} alt={name} title={`${name} · ${caps[viewing]?.label ?? ""}`}>
		<Button variant="outline" size="sm" class="rounded-full" onclick={swapPhoto}>换一张</Button>
		<ConfirmButton variant="outline" class="rounded-full" confirmLabel="确定拿掉？" onconfirm={removePhoto}>拿掉这张</ConfirmButton>
	</Lightbox>
{/if}
