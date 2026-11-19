<script lang="ts">
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import WhoBadge from "$lib/components/WhoBadge.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { ABOUT_DEFAULT_CATS } from "$lib/data/content";
	import { useCollection } from "$lib/sync.svelte";
	import { readLocal, writeLocal } from "$lib/local";
	import { WHO, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import X from "@lucide/svelte/icons/x";
	import Plus from "@lucide/svelte/icons/plus";

	const about = useCollection("about");
	const cats = useCollection("aboutcats");

	const allCats = $derived([
		...ABOUT_DEFAULT_CATS.map((c) => ({ id: c.id, name: c.name, custom: false })),
		...cats.docs
			.filter((d) => d.data.name)
			.sort((a, b) => (a.data.c ?? 0) - (b.data.c ?? 0))
			.map((d) => ({ id: d.id, name: d.data.name, custom: true })),
	]);

	// 没保存的输入存成草稿，刷新也不会丢
	let drafts = $state<Record<string, string>>(readLocal<Record<string, string>>("abdraft") ?? {});
	$effect(() => {
		writeLocal("abdraft", drafts);
	});
	const pending = $derived(Object.entries(drafts).filter(([k, v]) => v.trim() && allCats.some((c) => k.startsWith(`${c.id}|`))));

	function itemsOf(cat: string, who: Who) {
		return about.docs
			.filter((d) => d.data.cat === cat && d.data.who === who && d.data.t)
			.sort((a, b) => (a.data.c ?? 0) - (b.data.c ?? 0));
	}

	async function saveOne(key: string) {
		const [cat, who] = key.split("|") as [string, Who];
		const t = (drafts[key] ?? "").trim().slice(0, 40);
		if (!t) return;
		if (about.docs.some((d) => d.data.cat === cat && d.data.who === who && d.data.t === t)) {
			delete drafts[key];
			toast("已经有了");
			return;
		}
		try {
			await about.add({ cat, who, t, c: Date.now() });
			delete drafts[key];
		} catch {
			toast.error("没存上，再试一次");
		}
	}
	async function saveAll() {
		const keys = pending.map(([k]) => k);
		await Promise.all(keys.map(saveOne));
		toast.success(`全部保存好了，${keys.length} 项`);
	}

	let newCat = $state("");
	async function addCat(e: SubmitEvent) {
		e.preventDefault();
		const name = newCat.trim().slice(0, 16);
		if (!name) return;
		if (allCats.some((c) => c.name === name)) return toast("已经有这个分类了");
		await cats.add({ name, c: Date.now() }).then(
			() => {
				newCat = "";
				toast.success("分类加好了");
			},
			() => toast.error("没存上，再试一次"),
		);
	}
</script>

<PageHeader eyebrow="About us" title="关于我们" lede="我们各自喜欢的东西。每一栏两个人都可以自己往里加，也可以新建一个分类。" />

<div class="grid gap-4 md:grid-cols-2">
	{#each allCats as cat (cat.id)}
		{@const empty = !about.docs.some((d) => d.data.cat === cat.id)}
		<section class="rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--border)]">
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 class="flex items-center gap-2 text-xl font-bold"><i class="size-2.5 rounded-full bg-coral" aria-hidden="true"></i>{cat.name}</h2>
				{#if cat.custom && empty}
					<ConfirmButton size="xs" class="text-muted-foreground" onconfirm={() => cats.remove(cat.id).catch(() => toast.error("没删掉"))}>删除分类</ConfirmButton>
				{/if}
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each ["yi", "jq"] as const as who (who)}
					{@const key = `${cat.id}|${who}`}
					<div class="flex flex-col gap-2">
						<span class="flex items-center gap-2 text-sm font-semibold"><WhoBadge {who} size="sm" />{WHO[who]}</span>
						<div class="flex flex-wrap gap-1.5">
							{#each itemsOf(cat.id, who) as it (it.id)}
								<span class={cn("inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm", who === "yi" ? "bg-yi-soft" : "bg-jq-soft")}>
									{it.data.t}
									<ConfirmButton size="icon-xs" confirmLabel="删除" class="rounded-full" aria-label="删除" onconfirm={() => about.remove(it.id).catch(() => toast.error("没删掉"))}><X /></ConfirmButton>
								</span>
							{/each}
						</div>
						<form class="flex gap-1.5" onsubmit={(e) => { e.preventDefault(); saveOne(key); }}>
							<Input
								value={drafts[key] ?? ""}
								oninput={(e) => (drafts[key] = (e.currentTarget as HTMLInputElement).value)}
								maxlength={40}
								placeholder="＋ 加一个"
								aria-label={`${WHO[who]}的${cat.name}`}
								class="h-9"
							/>
							{#if drafts[key]?.trim()}<Button type="submit" size="sm">保存</Button>{/if}
						</form>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

<form onsubmit={addCat} class="mt-5 flex max-w-md gap-2">
	<Input bind:value={newCat} maxlength={16} placeholder="新分类，比如：喜欢的电影" aria-label="新分类名字" class="h-11" />
	<Button type="submit" class="h-11 rounded-full" disabled={!newCat.trim()}><Plus />新建分类</Button>
</form>

{#if pending.length}
	<div class="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-foreground py-2 pr-2 pl-5 text-background shadow-lg md:bottom-6">
		<span class="text-sm">还有 {pending.length} 项写了但没保存</span>
		<Button variant="secondary" size="sm" class="rounded-full" onclick={saveAll}>全部保存</Button>
	</div>
{/if}
