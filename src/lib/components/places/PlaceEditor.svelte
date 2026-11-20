<script lang="ts">
	import { toast } from "svelte-sonner";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { AREA, type Area } from "$lib/data/content";
	import { useCollection } from "$lib/sync.svelte";
	import type { CustomPlace, Doc } from "$lib/types";

	let {
		open = $bindable(false),
		kind,
		item = null,
		initialArea,
		onsaved,
	}: {
		open?: boolean; kind: "date" | "food"; item?: Doc<CustomPlace> | null;
		initialArea: Area | "all"; onsaved: (area: Area) => void;
	} = $props();

	const custom = useCollection("custom");
	const areas: Area[] = $derived(kind === "date" ? ["oc", "la", "mid", "far"] : ["oc", "la", "mid"]);
	const noun = $derived(kind === "date" ? "地点" : "餐厅");

	let f = $state({ name: "", area: "oc" as Area, type: "", price: "", desc: "", tip: "", q: "" });
	let err = $state("");
	let busy = $state(false);

	$effect(() => {
		if (!open) return;
		const d = item?.data;
		f = {
			name: d?.name ?? "",
			area: d && areas.includes(d.area as Area) ? d.area as Area : initialArea !== "all" && areas.includes(initialArea) ? initialArea : "oc",
			type: d?.type ?? "",
			price: d?.price ?? "",
			desc: d?.desc ?? "",
			tip: d?.tip ?? "",
			q: d?.q ?? "",
		};
		err = "";
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		const name = f.name.trim();
		if (!name) {
			err = "先写一个名字";
			return;
		}
		const savedArea = f.area;
		const data: CustomPlace = {
			kind,
			name: name.slice(0, 40),
			area: savedArea,
			type: f.type.trim().slice(0, 20),
			price: kind === "food" ? f.price : "",
			desc: f.desc.trim().slice(0, 200),
			tip: f.tip.trim().slice(0, 100),
			q: f.q.trim().slice(0, 100),
			c: item?.data.c ?? Date.now(),
		};
		busy = true;
		try {
			if (item) await custom.update(item.id, data);
			else await custom.add(data);
			toast.success(initialArea !== "all" && initialArea !== savedArea ? `已保存到${AREA[savedArea]}` : item ? "已保存" : `已添加${noun}`);
			open = false;
			onsaved(savedArea);
		} catch {
			err = "没保存上，再试一次";
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (!item || busy) return;
		busy = true;
		try {
			await custom.remove(item.id);
			toast("已删除");
			open = false;
		} catch {
			err = "没删掉，再试一次";
		} finally {
			busy = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-lg" showCloseButton={!busy} escapeKeydownBehavior={busy ? "ignore" : "close"} interactOutsideBehavior={busy ? "ignore" : "close"}>
		<Dialog.Header>
			<Dialog.Title class="font-display text-xl">{item ? "编辑" : "添加"}{noun}</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={submit} inert={busy} aria-busy={busy} class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<Label for="pe-name">名字</Label>
				<Input id="pe-name" bind:value={f.name} maxlength={40} required />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<Label id="pe-region-label" for="pe-region">地区</Label>
					<Select.Root type="single" value={f.area} onValueChange={(v) => { if (areas.includes(v as Area)) f.area = v as Area; }}>
						<Select.Trigger id="pe-region" aria-labelledby="pe-region-label pe-region-value" class="w-full"><span id="pe-region-value">{AREA[f.area]}</span></Select.Trigger>
						<Select.Content>
							{#each areas as a (a)}<Select.Item value={a} label={AREA[a]} />{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="pe-type">类型</Label>
					<Input id="pe-type" bind:value={f.type} maxlength={20} placeholder={kind === "date" ? "海滩、展览、夜景" : "日料、火锅、甜品"} />
				</div>
			</div>
			{#if kind === "food"}
				<div class="flex flex-col gap-1.5">
					<Label id="pe-price-label" for="pe-price">价位</Label>
					<Select.Root type="single" value={f.price} onValueChange={(v) => (f.price = v)}>
						<Select.Trigger id="pe-price" aria-labelledby="pe-price-label pe-price-value" class="w-full"><span id="pe-price-value">{f.price || "不填"}</span></Select.Trigger>
						<Select.Content>
							{#each ["", "$", "$$", "$$$", "$$$$"] as p (p)}<Select.Item value={p} label={p || "不填"} />{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}
			<div class="flex flex-col gap-1.5">
				<Label for="pe-desc">介绍</Label>
				<Textarea id="pe-desc" bind:value={f.desc} rows={3} maxlength={200} placeholder="为什么想去这里？" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="pe-tip">小贴士</Label>
				<Input id="pe-tip" bind:value={f.tip} maxlength={100} placeholder="比如：要提前订位、周末人多" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="pe-q">地图搜索词</Label>
				<Input id="pe-q" bind:value={f.q} maxlength={100} placeholder="不填就用名字搜索" />
			</div>
			{#if err}<p class="text-sm text-destructive" role="alert">{err}</p>{/if}
			<Dialog.Footer class="gap-2">
				{#if item}<ConfirmButton variant="ghost" class="mr-auto text-destructive" disabled={busy} confirmLabel={`删除${noun}`} description={`从共享清单删除「${item.data.name}」？无法撤销。`} onconfirm={remove}>删除{noun}</ConfirmButton>{/if}
				<Button variant="outline" onclick={() => (open = false)}>取消</Button>
				<Button type="submit" disabled={busy}>保存</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
