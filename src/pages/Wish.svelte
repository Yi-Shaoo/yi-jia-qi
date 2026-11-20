<script lang="ts">
	import { tick } from "svelte";
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import FilterChips from "$lib/components/FilterChips.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import WishRow from "$lib/components/WishRow.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Progress } from "$lib/components/ui/progress";
	import * as Select from "$lib/components/ui/select";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { query } from "$lib/router.svelte";
	import { WISH_CATS, addWish, catOf, wishNotice } from "$lib/wishes.svelte";
	import { WHO, type Doc, type Who, type Wish, type WishCat } from "$lib/types";
	import Plus from "@lucide/svelte/icons/plus";

	const wishes = useCollection("wishes");
	type Filter = "all" | WishCat;
	const FILTERS: Record<Filter, string> = { all: "全部", ...WISH_CATS };
	let filter = $state<Filter>("all");
	let text = $state("");
	let cat = $state<WishCat>("you");
	let from = $derived<Who>(session.who ?? "yi");
	let input = $state<HTMLInputElement | null>(null);
	let saving = $state(false);
	let error = $state("");
	let duplicate = $state("");
	let highlighted = $state("");
	const existing = $derived(duplicate ? wishes.get(duplicate) : undefined);

	function clearFeedback() {
		error = "";
		duplicate = "";
	}

	function chooseFilter(next: Filter) {
		highlighted = "";
		filter = next;
		if (!text && !saving && next !== "all") cat = next;
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (saving || !text.trim() || !wishes.ready) return;
		const raw = text, category = cat, wanted = category === "you" ? from : undefined;
		clearFeedback();
		saving = true;
		try {
			const result = await addWish(raw, category, wanted, false);
			const unchanged = text === raw && cat === category && (!wanted || wanted === from);
			if (result.status === "added") {
				if (unchanged) text = "";
				toast.success(`已加入${WISH_CATS[category]}`, { id: wishNotice(result.doc.id) });
			} else if (unchanged) {
				if (result.status === "error") error = result.message;
				if (result.status === "duplicate") duplicate = result.doc.id;
				if (document.activeElement === document.body || input?.form?.contains(document.activeElement)) input?.focus();
			}
		} finally {
			saving = false;
		}
	}

	const groups = $derived(
		(filter === "all" ? (Object.keys(WISH_CATS) as WishCat[]) : [filter])
			.map((k) => {
				const items = wishes.docs
					.filter((d) => catOf(d.data) === k)
					.sort((a, b) => Number(!!a.data.d) - Number(!!b.data.d) || (a.data.c ?? 0) - (b.data.c ?? 0));
				return { k, items, done: items.filter((d) => d.data.d).length };
			})
			.filter((g) => g.items.length || (filter !== "all" && wishes.ready)),
	);

	async function reveal(doc: Doc<Wish>) {
		filter = catOf(doc.data);
		highlighted = doc.id;
		toast.dismiss(wishNotice(doc.id));
		await tick();
		const row = document.getElementById(`wish-${doc.id}`);
		row?.focus({ preventScroll: true });
		row?.scrollIntoView({ block: "center", inline: "nearest" });
	}

	let located: string | null = null;
	const target = $derived(query("item"));
	$effect(() => {
		if (!target) { located = null; return; }
		if (located === target) return;
		const match = wishes.get(target);
		if (match) {
			located = target;
			reveal(match);
		}
	});
</script>

{#snippet sources(category: Filter)}
	<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sea underline underline-offset-4">
		{#if category === "all" || category === "place"}<a href="/dates">约会地点</a><a href="/roadtrip">自驾路线</a><a href="/holiday">节日活动</a>{/if}
		{#if category === "all" || category === "food"}<a href="/food">找餐厅</a>{/if}
	</div>
{/snippet}

<PageHeader title="心愿清单" />

<div class="flex min-w-0 flex-col gap-5">
	<form onsubmit={submit} class="surface-card grid min-w-0 gap-3 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
		<div class="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(18rem,auto)] md:items-end">
			<div class="grid min-w-0 gap-1.5">
				<label for="wish-text" class="text-sm font-medium">新心愿</label>
				<Input id="wish-text" bind:ref={input} bind:value={text} oninput={clearFeedback} maxlength={80} aria-describedby={error || existing ? "wish-feedback" : undefined} class="h-11" />
			</div>
			<div class="flex min-w-0 flex-wrap gap-3">
				<div class="grid min-w-0 flex-[1_1_10rem] gap-1.5">
					<label id="wish-cat-label" for="wish-cat" class="text-sm font-medium">分类</label>
					<Select.Root type="single" value={cat} onValueChange={(v) => { cat = v as WishCat; clearFeedback(); }}>
						<Select.Trigger id="wish-cat" aria-labelledby="wish-cat-label" class="w-full min-w-0 text-left whitespace-normal data-[size=default]:min-h-11">{WISH_CATS[cat]}</Select.Trigger>
						<Select.Content>
							{#each Object.entries(WISH_CATS) as [k, name] (k)}<Select.Item value={k} label={name} />{/each}
						</Select.Content>
					</Select.Root>
				</div>
				{#if cat === "you"}
					<div class="grid min-w-0 flex-[1_1_7rem] gap-1.5">
						<label id="wish-from-label" for="wish-from" class="text-sm font-medium">谁想要</label>
						<Select.Root type="single" value={from} onValueChange={(v) => { from = v as Who; clearFeedback(); }}>
							<Select.Trigger id="wish-from" aria-labelledby="wish-from-label" class="w-full min-w-0 text-left whitespace-normal data-[size=default]:min-h-11">{WHO[from]}</Select.Trigger>
							<Select.Content>
								{#each ["yi", "jq"] as const as who (who)}<Select.Item value={who} label={WHO[who]} />{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>
		</div>
		{#if error || existing}
			<p id="wish-feedback" class="text-sm text-muted-foreground lg:col-span-2 lg:row-start-2" role="status">
				{#if existing}这条心愿已存在。 <button type="button" class="text-sea underline" onclick={() => existing && reveal(existing)}>查看这条心愿</button>{:else}{error}{/if}
			</p>
		{/if}
		<Button type="submit" class="h-11 rounded-full px-5 sm:justify-self-end lg:col-start-2 lg:row-start-1" disabled={saving || !text.trim() || !wishes.ready}><Plus />{saving ? "添加中…" : error ? "重试添加" : "添加心愿"}</Button>
	</form>

	<FilterChips wrap options={FILTERS} bind:value={() => filter, chooseFilter} label="心愿分类" />
	<CollectionNotice status={wishes.status} retry={() => wishes.load()} label="心愿清单" />
	{#if target && wishes.ready && !wishes.get(target)}
		<p role="status" class="text-sm text-muted-foreground">这条心愿已不在清单中。</p>
	{/if}
	{#if wishes.ready && !groups.length}
		<div class="surface-card p-5">
			<p>还没有心愿。</p>
			{@render sources("all")}
		</div>
	{/if}

	{#each groups as g (g.k)}
		<section class="surface-card min-w-0 p-5 md:p-6">
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="min-w-0 text-xl font-bold">{WISH_CATS[g.k]}</h2>
				<b class="shrink-0 font-display text-lg whitespace-nowrap tabular-nums">{g.done} / {g.items.length}</b>
			</div>
			{#if g.k === "place"}<p class="mt-1 text-sm text-muted-foreground">含约会地点、自驾路线和节日活动</p>{/if}
			<Progress value={g.items.length ? g.done / g.items.length * 100 : 0} aria-label={`${WISH_CATS[g.k]}完成进度`} aria-valuetext={`已完成 ${g.done} 项，共 ${g.items.length} 项`} class="mt-3 h-2" />
			{#if g.items.length}
				<ul class="mt-2">
					{#each g.items as wish (wish.id)}<WishRow {wish} highlighted={highlighted === wish.id} />{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-muted-foreground">这个分类还没有心愿。</p>
				{#if g.k !== "you"}{@render sources(g.k)}{/if}
			{/if}
		</section>
	{/each}
</div>
