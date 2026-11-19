<script lang="ts">
	import { toast } from "svelte-sonner";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { AREA } from "$lib/data/content";
	import { useCollection } from "$lib/sync.svelte";
	import type { CustomPlace, Doc } from "$lib/types";

	let {
		open = $bindable(false),
		kind,
		item = null,
	}: { open?: boolean; kind: "date" | "food"; item?: Doc<CustomPlace> | null } = $props();

	const custom = useCollection("custom");
	const areas = $derived((kind === "date" ? ["oc", "la", "mid", "far"] : ["oc", "la", "mid"]) as (keyof typeof AREA)[]);

	let f = $state({ name: "", area: "oc", type: "", price: "", desc: "", tip: "", q: "" });
	let err = $state("");
	let busy = $state(false);

	$effect(() => {
		if (!open) return;
		const d = item?.data;
		f = {
			name: d?.name ?? "",
			area: d && AREA[d.area as keyof typeof AREA] ? d.area : "oc",
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
		const name = f.name.trim();
		if (!name) {
			err = "先写一个名字";
			return;
		}
		const data: CustomPlace = {
			kind,
			name: name.slice(0, 40),
			area: f.area,
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
			toast.success(item ? "已保存" : "加好了");
			open = false;
		} catch {
			err = "没保存上，再试一次";
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (!item) return;
		try {
			await custom.remove(item.id);
			toast("已删除");
			open = false;
		} catch {
			err = "没删掉，再试一次";
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-display text-xl">{item ? "编辑" : kind === "date" ? "加一个约会地点" : "加一家店"}</Dialog.Title>
			<Dialog.Description>自己写名字、介绍和小贴士，两个人都能看到。</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={submit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<Label for="pe-name">名字</Label>
				<Input id="pe-name" bind:value={f.name} maxlength={40} required />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<Label>在哪</Label>
					<Select.Root type="single" value={f.area} onValueChange={(v) => (f.area = v)}>
						<Select.Trigger class="w-full">{AREA[f.area as keyof typeof AREA]}</Select.Trigger>
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
					<Label>价位</Label>
					<Select.Root type="single" value={f.price} onValueChange={(v) => (f.price = v)}>
						<Select.Trigger class="w-full">{f.price || "不填"}</Select.Trigger>
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
				{#if item}<ConfirmButton variant="outline" class="mr-auto" onconfirm={remove}>删除</ConfirmButton>{/if}
				<Button variant="outline" onclick={() => (open = false)}>取消</Button>
				<Button type="submit" disabled={busy}>保存</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
