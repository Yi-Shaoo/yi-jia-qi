<script lang="ts">
	import { tick } from "svelte";
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { ABOUT_DEFAULT_CATS } from "$lib/data/content";
	import { draftSummary, hasAboutDraft, saveAboutDraft } from "$lib/about-drafts";
	import { useCollection } from "$lib/sync.svelte";
	import { me } from "$lib/session.svelte";
	import { accountKey, readLocal, writeLocal } from "$lib/local";
	import { WHO, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import X from "@lucide/svelte/icons/x";
	import Plus from "@lucide/svelte/icons/plus";

	const about = useCollection("about");
	const cats = useCollection("aboutcats");
	const status = $derived(about.status === "error" || cats.status === "error" ? "error" : about.ready && cats.ready ? "ready" : "loading");
	const retryLoad = () => Promise.all([about, cats].filter((c) => !c.ready).map((c) => c.load()));
	const allCats = $derived([
		...ABOUT_DEFAULT_CATS.map((c) => ({ id: c.id, name: c.name, custom: false })),
		...cats.docs
			.filter((d) => d.data.name)
			.sort((a, b) => (a.data.c ?? 0) - (b.data.c ?? 0))
			.map((d) => ({ id: d.id, name: d.data.name, custom: true })),
	]);

	const draftsKey = accountKey("abdraft", me());
	let drafts = $state<Record<string, string>>(readLocal<Record<string, string>>(draftsKey) ?? {});
	let failures = $state<Record<string, boolean>>({});
	const revisions = new Map<string, number>();
	let revision = 0;
	let saving = $state(false);
	let lastSaved = $state(0);
	$effect(() => { writeLocal(draftsKey, drafts); });
	const pending = $derived(Object.entries(drafts).filter(([k, v]) => v.trim() && allCats.some((c) => k.startsWith(`${c.id}|`))));
	const issues = $derived.by(() => {
		const result: Partial<Record<string, "failed" | "duplicate">> = {};
		for (const [key, raw] of pending) {
			if (hasAboutDraft(about.docs, key, raw)) result[key] = "duplicate";
			else if (failures[key]) result[key] = "failed";
		}
		return result;
	});
	const eligible = $derived(pending.filter(([key]) => issues[key] !== "duplicate"));
	const retrying = $derived(eligible.length > 0 && eligible.every(([key]) => issues[key] === "failed"));
	const summary = $derived(draftSummary(pending.map(([key]) => issues[key] ?? "pending"), lastSaved));

	function itemsOf(cat: string, who: Who) {
		return about.docs
			.filter((d) => d.data.cat === cat && d.data.who === who && d.data.t)
			.sort((a, b) => (a.data.c ?? 0) - (b.data.c ?? 0));
	}

	function editDraft(key: string, value: string) {
		if (value) drafts[key] = value;
		else delete drafts[key];
		revisions.set(key, ++revision);
		delete failures[key];
		lastSaved = 0;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		const entries = eligible;
		if (saving || status !== "ready" || !entries.length) return;
		const form = e.currentTarget as HTMLFormElement, origin = document.activeElement;
		const started = revision;
		saving = true;
		lastSaved = 0;
		try {
			const results = await Promise.all(entries.map(async ([key, raw]) => {
				const result = await saveAboutDraft(about, key, raw);
				if ((revisions.get(key) ?? 0) <= started) {
					if (result === "saved") {
						delete drafts[key];
						delete failures[key];
					} else if (result === "failed") failures[key] = true;
				}
				return result;
			}));
			if (!form.isConnected) return;
			const edited = revision !== started;
			const saved = results.filter((r) => r === "saved").length;
			if (saved && (!pending.length || edited)) toast.success(draftSummary([], saved));
			else lastSaved = saved;
			await tick();
			if (!edited && (document.activeElement === origin || document.activeElement === document.body)) {
				const fallback = origin instanceof HTMLInputElement && form.contains(origin) ? origin : document.getElementById(`draft-${entries[0][0]}`);
				const target = form.querySelector<HTMLInputElement>("input[aria-describedby]") ?? fallback;
				target?.focus();
			}
		} finally {
			saving = false;
		}
	}

	let newCat = $state("");
	let categoryBusy = $state(false);
	let catFailed = $state(false);
	let catRevision = 0;
	const catDuplicate = $derived(!!newCat.trim() && allCats.some((c) => c.name.trim() === newCat.trim()));
	const catProblem = $derived(catDuplicate ? `分类「${newCat.trim()}」已存在` : catFailed ? "分类没能保存，请重试" : "");
	let catInput = $state<HTMLInputElement | null>(null);
	async function addCat(e: SubmitEvent) {
		e.preventDefault();
		const name = newCat.trim(), revision = catRevision;
		if (!name || categoryBusy || !cats.ready || catDuplicate) return;
		const origin = document.activeElement;
		categoryBusy = true;
		catFailed = false;
		try {
			await cats.add({ name, c: Date.now() });
			if (catRevision === revision) newCat = "";
			toast.success("分类加好了");
		} catch {
			if (catRevision === revision) catFailed = true;
		} finally {
			categoryBusy = false;
			await tick();
			if (catRevision === revision && (document.activeElement === origin || document.activeElement === document.body)) catInput?.focus();
		}
	}
</script>

<PageHeader title="关于我们" />
<CollectionNotice {status} retry={retryLoad} />

<div class="grid gap-4 md:grid-cols-2">
<form id="about-drafts" aria-label="关于我们的条目" onsubmit={save} class="contents">
	{#each allCats as cat (cat.id)}
		{@const empty = status === "ready" && !about.docs.some((d) => d.data.cat === cat.id) && !pending.some(([k]) => k.startsWith(`${cat.id}|`))}
		<section class="surface-card min-w-0 p-5">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
				<h2 class="min-w-0 text-xl font-bold wrap-anywhere">{cat.name}</h2>
				{#if cat.custom && empty}
					<ConfirmButton size="xs" class="text-muted-foreground" aria-label={`删除分类：${cat.name}`} confirmLabel={`确认删除分类：${cat.name}？`} description={`删除空分类「${cat.name}」后无法恢复。`} onconfirm={() => cats.remove(cat.id).catch(() => toast.error("分类没删掉，请重试"))}>删除分类</ConfirmButton>
				{/if}
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each ["yi", "jq"] as const as who (who)}
					{@const key = `${cat.id}|${who}`}
					{@const items = itemsOf(cat.id, who)}
					<div class="flex min-w-0 flex-col gap-2">
						<h3 class="text-sm font-semibold"><label for={`draft-${key}`}>{WHO[who]}</label></h3>
						{#if items.length}
							<ul class="flex flex-wrap gap-1.5">
								{#each items as it (it.id)}
									<li class={cn("inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl py-1 pr-1 pl-3 text-sm", who === "yi" ? "bg-yi-soft" : "bg-jq-soft")}>
										<span class="min-w-0 wrap-anywhere">{it.data.t}</span>
										<ConfirmButton size="icon-xs" class="h-auto min-h-6 max-w-full min-w-0 shrink rounded-full whitespace-normal wrap-anywhere" aria-label={`删除${WHO[who]}的${cat.name}：${it.data.t}`} confirmLabel={`确认删除${WHO[who]}的${cat.name}：${it.data.t}？`} onconfirm={() => about.remove(it.id).catch(() => toast.error("这项没删掉，请重试"))}><X /></ConfirmButton>
									</li>
								{/each}
							</ul>
						{/if}
						<Input
							id={`draft-${key}`} value={drafts[key] ?? ""} oninput={(e) => editDraft(key, e.currentTarget.value)} maxlength={40}
							placeholder="加一项" aria-label={`${WHO[who]}的${cat.name}`} aria-invalid={issues[key] === "duplicate" || undefined} aria-describedby={issues[key] ? `issue-${key}` : undefined}
						/>
						{#if issues[key]}<p id={`issue-${key}`} role="status" class="text-sm wrap-anywhere text-destructive">{issues[key] === "duplicate" ? `「${drafts[key].trim()}」已存在` : "这项没能保存，请重试"}</p>{/if}
					</div>
				{/each}
			</div>
		</section>
	{/each}
</form>

<form aria-label="新建分类" onsubmit={addCat} class="surface-card grid min-w-0 content-start gap-2 p-5">
	<label for="about-category" class="text-sm font-semibold">分类名</label>
	<div class="flex items-center gap-2">
		<Input id="about-category" bind:ref={catInput} bind:value={newCat} oninput={() => { catRevision++; catFailed = false; }} maxlength={16} placeholder="例如：喜欢的电影" aria-invalid={catDuplicate || undefined} aria-describedby={catProblem ? "category-problem" : undefined} class="h-11" />
		<Button type="submit" class="h-11 rounded-full" disabled={!newCat.trim() || !cats.ready || categoryBusy || catDuplicate}><Plus />{catFailed && !catDuplicate ? "重试新建" : "新建分类"}</Button>
	</div>
	{#if catProblem}<p id="category-problem" role="status" class="text-sm wrap-anywhere text-destructive">{catProblem}</p>{/if}
</form>
</div>

{#if pending.length}
	<div class="sticky bottom-24 z-30 mx-auto mt-5 flex max-w-md items-center justify-between gap-3 rounded-3xl bg-foreground py-2 pr-2 pl-5 text-background shadow-lg md:bottom-6">
		<span role="status" class="text-sm">{summary}</span>
		<Button type="submit" form="about-drafts" variant="secondary" size="sm" class="rounded-full" disabled={saving || status !== "ready" || !eligible.length}>{saving ? "保存中…" : retrying ? "重试" : eligible.length < pending.length ? "保存" : "全部保存"}</Button>
	</div>
{/if}
