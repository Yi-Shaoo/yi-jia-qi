<script lang="ts">
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import Postcard from "$lib/components/diary/Postcard.svelte";
	import Pudding from "$lib/components/diary/Pudding.svelte";
	import DiaryEditor from "$lib/components/diary/DiaryEditor.svelte";
	import { entryDraft, newDrafts, resolveEditor, todayDiaryAction, type DiaryRequest, type EditorTarget } from "$lib/components/diary/drafts";
	import { diaryTitle } from "$lib/components/diary/entry";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { navigate, query, route } from "$lib/router.svelte";
	import { fmtDots, isDateKey } from "$lib/dates";
	import { localDay } from "$lib/local-day";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import PenLine from "@lucide/svelte/icons/pen-line";

	const diary = useCollection("diary");
	const diaryAction = $derived(todayDiaryAction(diary, session.who, $localDay));
	const list = $derived(diary.docs.filter((d) => isDateKey(d.data.date)).sort((a, b) =>
		b.data.date.localeCompare(a.data.date) || (b.data.c ?? 0) - (a.data.c ?? 0),
	));
	let editor = $state.raw<EditorTarget | null>(null);
	let pudding: Pudding;

	const newEntries = $derived(!editor && session.who ? newDrafts(session.who) : []);
	const drafts = $derived(newEntries.filter(({ key }) => key !== diaryAction.draftKey));
	const primaryTitle = $derived(diaryAction.entry
		? (list.some((d) => d.data.date === $localDay && d.id !== diaryAction.itemId) ? diaryTitle(diaryAction.entry) : "")
		: newEntries.find(({ key }) => key === diaryAction.draftKey)?.draft.fields.title);
	const cardDrafts = $derived.by(() => {
		const who = session.who;
		return new Set(!editor && who ? list.filter((d) => entryDraft(d, who)).map((d) => d.id) : []);
	});

	function start(request: DiaryRequest) {
		if (!session.who || !diary.ready || editor) return;
		editor = resolveEditor(diary, session.who, request);
		if (!editor) {
			toast.error("没能打开这篇日记或草稿，请重新选择。");
		}
	}

	$effect(() => {
		if (route.path !== "/diary" || query("write") !== "today" || !diary.ready) return;
		untrack(() => {
			const url = new URL(location.href);
			url.searchParams.delete("write");
			navigate(url.pathname + url.search + url.hash, { replace: true });
			start({ today: $localDay });
		});
	});
</script>

<div class="flex flex-wrap items-end justify-between gap-4">
	<PageHeader title="约会日记">
		{#snippet actions()}
			{#if primaryTitle}
				<span class="self-center text-sm break-words text-muted-foreground">今天 · {primaryTitle}</span>
			{/if}
			<Button class="rounded-full" disabled={!diary.ready} onclick={() => start({ today: $localDay })}><PenLine />{diaryAction.label}</Button>
		{/snippet}
	</PageHeader>
	<div class="hidden pb-6 md:block"><Pudding bind:this={pudding} /></div>
</div>

{#if drafts.length}
	<section aria-label="本机文字草稿" class="mb-5 grid gap-2">
		{#each drafts as { key, draft } (key)}
			<div class="flex items-center justify-between gap-3 rounded-2xl bg-sand px-4 py-3 text-sm text-sand-ink">
				<span class="min-w-0 break-words">{draft.fields.date || "未选日期"} · 文字草稿{draft.fields.title ? `《${draft.fields.title}》` : ""}</span>
				<Button size="sm" disabled={!diary.ready} onclick={() => start({ draftKey: key })}>继续写</Button>
			</div>
		{/each}
	</section>
{/if}

<CollectionNotice status={diary.status} retry={() => diary.load()} label="日记" />
{#if diary.ready && !diary.docs.length}
	<p class="surface-card p-6 text-muted-foreground">还没有日记。</p>
{:else if diary.ready && !list.length}
	<p role="status" class="text-sm text-muted-foreground">已载入的日记缺少有效日期，无法列出。</p>
{/if}

<div class="flex flex-col gap-6">
	{#each list as d (d.id)}
		<article class="surface-card min-w-0 p-5 md:p-6">
			<div class="flex flex-wrap items-center gap-2">
				<time datetime={d.data.date} class="font-mono text-xs text-muted-foreground">{fmtDots(d.data.date)}</time>
				<Badge variant={d.data.kind === "apart" ? "secondary" : "default"} class={d.data.kind === "together" ? "bg-coral text-primary-foreground" : ""}>
					{d.data.kind === "apart" ? "各自的一天" : "见面的一天"}
				</Badge>
			</div>
			<h2 class="mt-2 text-2xl font-bold break-words">{diaryTitle(d.data)}</h2>
			{#if d.data.place}
				<span class="inline-flex items-baseline gap-1 text-sm wrap-anywhere text-muted-foreground"><MapPin aria-hidden="true" class="size-4 shrink-0 self-center" />共享地点：{d.data.place}</span>
			{/if}
			<div class="mt-4 grid divide-y border-t md:grid-cols-2 md:divide-x md:divide-y-0">
				{#each ["yi", "jq"] as const as w (w)}
					<Postcard who={w} side={d.data[w]} date={d.data.date} mine={w === session.who}
						hasDraft={cardDrafts.has(d.id)} disabled={!diary.ready} onwrite={d.id === diaryAction.itemId ? undefined : () => start({ id: d.id })} />
				{/each}
			</div>
		</article>
	{/each}
</div>

{#if editor}
	<DiaryEditor target={editor} onclose={() => (editor = null)} onsaved={() => pudding?.cheer()} />
{/if}
