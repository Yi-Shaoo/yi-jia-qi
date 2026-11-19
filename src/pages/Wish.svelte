<script lang="ts">
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Progress } from "$lib/components/ui/progress";
	import * as Select from "$lib/components/ui/select";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { WISH_CATS, addWish, byOf, catOf } from "$lib/wishes.svelte";
	import { heartBurst } from "$lib/fx";
	import { WHO, otherOf, type Doc, type Who, type Wish, type WishCat } from "$lib/types";
	import { cn } from "$lib/utils";
	import X from "@lucide/svelte/icons/x";
	import Plus from "@lucide/svelte/icons/plus";

	const wishes = useCollection("wishes");
	const me = $derived(session.who as Who);

	type Filter = "all" | WishCat;
	let filter = $state<Filter>("all");
	const FILTERS: Record<Filter, string> = { all: "全部", you: "给对方的小心愿", place: "旅行地点", food: "餐厅" };

	let text = $state("");
	let cat = $state<WishCat>("you");
	let from = $state<Who>("yi");
	$effect(() => {
		from = me;
	});
	$effect(() => {
		if (filter !== "all") cat = filter;
	});
	const PLACEHOLDER: Record<WishCat, string> = {
		place: "写一个想一起去的地方",
		food: "写一家想一起去吃的店",
		you: "写一件想和对方一起做、或想让对方为你做的小事",
	};

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!text.trim()) return;
		await addWish(text, cat, cat === "you" ? from : undefined);
		text = "";
	}

	const groups = $derived(
		(filter === "all" ? (Object.keys(WISH_CATS) as WishCat[]) : [filter])
			.map((k) => {
				const items = wishes.docs
					.filter((d) => catOf(d.data) === k)
					.sort((a, b) => Number(a.data.d) - Number(b.data.d) || (a.data.c ?? 0) - (b.data.c ?? 0));
				return { k, items, done: items.filter((d) => d.data.d).length };
			})
			.filter((g) => filter !== "all" || g.items.length),
	);

	async function toggle(w: Doc<Wish>, el: HTMLElement | null) {
		const v = !w.data.d;
		if (v) heartBurst(el);
		try {
			await wishes.update(w.id, { d: v });
		} catch {
			toast.error("没存上，再试一次");
		}
	}

	function tagText(w: Wish) {
		const b = byOf(w);
		const you = catOf(w) === "you" && (w.from === "yi" || w.from === "jq");
		if (you) return `${WHO[w.from as Who]} 想要${w.by && w.by !== w.from ? ` · ${WHO[w.by as Who]} 加的` : ""}`;
		if (b) return `${WHO[b]} 加的`;
		return "";
	}
	function tagWho(w: Wish): Who | "" {
		return catOf(w) === "you" && (w.from === "yi" || w.from === "jq") ? w.from : byOf(w);
	}
	async function swapBy(w: Doc<Wish>) {
		const b = byOf(w.data);
		const v: Who = b ? otherOf(b) : me;
		await wishes.update(w.id, { by: v }).then(
			() => toast(`标成 ${WHO[v]} 加的`),
			() => toast.error("没存上，再试一次"),
		);
	}
	async function remove(w: Doc<Wish>) {
		await wishes.remove(w.id).catch(() => toast.error("没删掉，再试一次"));
	}
	const fmtC = (c: number) => (c ? `${new Date(c).getMonth() + 1}.${new Date(c).getDate()}` : "");
</script>

<PageHeader
	eyebrow="Bucket list"
	title="心愿清单"
	lede="在约会、美食、Road-trip 和节日页点“想去”，会自动放进对应的分类。两个人都能看到、都能打勾。"
/>

<div class="flex flex-col gap-5">
	<FilterChips options={FILTERS} bind:value={filter} label="心愿分类" />

	<form onsubmit={submit} class="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-[0_0_0_1px_var(--border)] md:flex-row md:items-center">
		<Input bind:value={text} maxlength={80} placeholder={PLACEHOLDER[cat]} aria-label="新心愿" class="h-11 flex-1" />
		<div class="flex gap-2">
			<Select.Root type="single" value={cat} onValueChange={(v) => (cat = v as WishCat)}>
				<Select.Trigger class="h-11 min-w-36" aria-label="分类">{WISH_CATS[cat][0]}</Select.Trigger>
				<Select.Content>
					{#each Object.entries(WISH_CATS) as [k, v] (k)}<Select.Item value={k} label={v[0]} />{/each}
				</Select.Content>
			</Select.Root>
			{#if cat === "you"}
				<Select.Root type="single" value={from} onValueChange={(v) => (from = v as Who)}>
					<Select.Trigger class="h-11 min-w-28" aria-label="谁的心愿">{WHO[from]} 想要</Select.Trigger>
					<Select.Content>
						<Select.Item value="yi" label="Yi 想要" />
						<Select.Item value="jq" label="Jia Qi 想要" />
					</Select.Content>
				</Select.Root>
			{/if}
			<Button type="submit" class="h-11 rounded-full px-5" disabled={!text.trim()}><Plus />添加</Button>
		</div>
	</form>

	{#if wishes.status === "loading"}
		<p class="text-muted-foreground">正在加载…</p>
	{:else if !groups.length}
		<p class="rounded-2xl bg-card p-6 text-muted-foreground shadow-[0_0_0_1px_var(--border)]">
			还没有心愿。去约会、美食或节日页点“想去”，或者在上面直接写。
		</p>
	{/if}

	{#each groups as g (g.k)}
		<section class="rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--border)] md:p-6">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 class="text-xl font-bold">{WISH_CATS[g.k][0]}</h2>
					<p class="text-[13px] text-muted-foreground">{WISH_CATS[g.k][1]}</p>
				</div>
				<b class="font-display text-lg tabular-nums">{g.done} / {g.items.length}</b>
			</div>
			<Progress value={g.items.length ? (g.done / g.items.length) * 100 : 0} class="mt-3 h-2" />
			{#if !g.items.length}
				<p class="mt-4 text-sm text-muted-foreground">
					{g.k === "you" ? "写一件小心愿，比如“每天睡前说晚安”。" : `去${g.k === "food" ? "美食" : "约会或 Road-trip"}页点“想去”，或者在上面直接写。`}
				</p>
			{/if}
			<ul class="mt-3 flex flex-col">
				{#each g.items as w (w.id)}
					{@const tw = tagWho(w.data)}
					{@const theirs = byOf(w.data) && byOf(w.data) !== me}
					<li
						class={cn(
							"group flex min-h-12 items-center gap-3 border-b py-2 last:border-b-0",
							theirs && "border-l-2 border-l-dashed pl-2",
						)}
					>
						<label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
							<Checkbox
								checked={w.data.d}
								onCheckedChange={() => toggle(w, document.getElementById(`w-${w.id}`))}
								id={`w-${w.id}`}
								class="size-5"
							/>
							<span class={cn("min-w-0 flex-1", w.data.d && "text-muted-foreground line-through")}>{w.data.t}</span>
						</label>
						{#if tagText(w.data)}
							<button
								type="button"
								onclick={() => swapBy(w)}
								title="点一下可以改成另一个人"
								class={cn(
									"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
									tw === "yi" ? "bg-yi-soft text-yi" : "bg-jq-soft text-jq",
								)}
							>
								{tagText(w.data)}
							</button>
						{:else}
							<button type="button" onclick={() => swapBy(w)} class="shrink-0 rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground">谁加的？</button>
						{/if}
						<small class="hidden w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">{fmtC(w.data.c)}</small>
						<ConfirmButton size="icon-sm" confirmLabel="删除？" class="shrink-0 data-[variant=ghost]:opacity-60" onconfirm={() => remove(w)} aria-label="删除">
							<X />
						</ConfirmButton>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
