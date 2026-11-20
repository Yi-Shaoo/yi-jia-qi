<script lang="ts">
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import "$lib/components/diary/stationery.css";
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
	import { isDateKey } from "$lib/dates";
	import { localDay } from "$lib/local-day";
	import PenLine from "@lucide/svelte/icons/pen-line";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import EmptyState from "$lib/components/EmptyState.svelte";
	import { Card } from "$lib/components/ui/card";

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

<section aria-labelledby="diary-title">
	<PageHeader id="diary-title" title="约会日记" lede="同一天，两个人各写一边。">
		{#snippet actions()}
			{#if primaryTitle}<span class="text-sm text-muted-foreground wrap-anywhere">今天 · {primaryTitle}</span>{/if}
			<Button disabled={!diary.ready} onclick={() => start({ today: $localDay })}><PenLine />{diaryAction.label}</Button>
		{/snippet}
	</PageHeader>

{#if drafts.length}
	<section aria-label="本机文字草稿" class="mb-5 grid gap-2">
		{#each drafts as { key, draft } (key)}
			<Card variant="surface" class="flex items-center justify-between gap-3 p-4 text-sm">
				<span class="min-w-0 break-words">{draft.fields.date || "未选日期"} · 文字草稿{draft.fields.title ? `《${draft.fields.title}》` : ""}</span>
				<Button size="sm" disabled={!diary.ready} onclick={() => start({ draftKey: key })}>继续写</Button>
			</Card>
		{/each}
	</section>
{/if}

<CollectionNotice status={diary.status} retry={() => diary.load()} label="日记" />
{#if diary.ready && !diary.docs.length}
	<EmptyState message="还没有日记。" />
{:else if diary.ready && !list.length}
	<p role="status" class="text-sm text-muted-foreground">已载入的日记缺少有效日期，无法列出。</p>
{/if}

<div class="grid gap-5">
	{#each list as d (d.id)}
		<Card as="article" variant="surface" class="min-w-0 p-5 md:p-6" aria-labelledby={`diary-title-${d.id}`}>
			<div class="flex flex-wrap items-center gap-2">
				<time datetime={d.data.date} class="font-mono text-sm font-medium whitespace-nowrap text-foreground tabular-nums">{d.data.date.replaceAll("-", ".")}</time>
				<Badge variant={d.data.kind === "apart" ? "outline" : "secondary"}>
					{d.data.kind === "apart" ? "各自的一天" : "见面的一天"}
				</Badge>
			</div>
			<h2 class="mt-2 text-xl font-bold wrap-anywhere md:text-2xl" id={`diary-title-${d.id}`}>{diaryTitle(d.data)}</h2>
			<div class="diary-postcards">
				{#each ["yi", "jq"] as const as w (w)}
					<Postcard who={w} side={d.data[w]} kind={d.data.kind} date={d.data.date} mine={w === session.who}
						hasDraft={cardDrafts.has(d.id)} disabled={!diary.ready} onwrite={d.id === diaryAction.itemId ? undefined : () => start({ id: d.id })} />
				{/each}
			</div>
		</Card>
	{/each}
</div>
<div class="mt-6"><Pudding bind:this={pudding} /></div>
</section>

{#if editor}
	<DiaryEditor target={editor} onclose={() => (editor = null)} onsaved={() => pudding?.cheer()} />
{/if}
