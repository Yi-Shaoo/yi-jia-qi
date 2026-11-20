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
	import { fmtDots, isDateKey } from "$lib/dates";
	import { localDay } from "$lib/local-day";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import PenLine from "@lucide/svelte/icons/pen-line";
	import Heart from "@lucide/svelte/icons/heart";
	import Star from "@lucide/svelte/icons/star";

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

<section class="diary-shop" aria-labelledby="diary-title">
	<header class="diary-counter">
		<div class="diary-awning" aria-hidden="true"></div>
		<div class="diary-counter-body">
			<div class="diary-sprinkles" aria-hidden="true">
				<i class="macaron berry"></i><i class="macaron mint"></i><i class="macaron sky"></i>
				<Star class="sugar-star" />
				<svg class="sugar-berry" viewBox="0 0 24 24" fill="none">
					<path d="M12 7c4-3 9 0 8 5-1 6-6 10-8 10S5 18 4 12c-1-5 4-8 8-5Z" fill="var(--pink)" />
					<path d="M12 8c-1-3 1-5 3-6m-3 6c2-3 4-4 6-2" stroke="var(--mint-ink)" stroke-width="1.6" stroke-linecap="round" />
					<path d="m8 12 .5 1m5-2 .5 1m-3 4 .5 1m4-3 .5 1" stroke="var(--cream)" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</div>
			<div class="diary-counter-copy">
				<span class="shop-sign"><Heart aria-hidden="true" />今日特供 · 我们的约会</span>
				<h1 id="diary-title">约会日记</h1>
				<p class="diary-intro">同一天，两扇窗。今天的心情，一人写一边。</p>
				<div class="diary-counter-actions">
					<Button class="diary-write" disabled={!diary.ready} onclick={() => start({ today: $localDay })}><PenLine aria-hidden="true" />{diaryAction.label}</Button>
					{#if primaryTitle}<span class="text-sm wrap-anywhere">今天 · {primaryTitle}</span>{/if}
				</div>
			</div>
			<Pudding bind:this={pudding} />
		</div>
	</header>

{#if drafts.length}
	<section aria-label="本机文字草稿" class="mb-5 grid gap-2">
		{#each drafts as { key, draft } (key)}
			<div class="diary-draft flex items-center justify-between gap-3 px-4 py-3 text-sm">
				<span class="min-w-0 break-words">{draft.fields.date || "未选日期"} · 文字草稿{draft.fields.title ? `《${draft.fields.title}》` : ""}</span>
				<Button size="sm" disabled={!diary.ready} onclick={() => start({ draftKey: key })}>继续写</Button>
			</div>
		{/each}
	</section>
{/if}

<CollectionNotice status={diary.status} retry={() => diary.load()} label="日记" />
{#if diary.ready && !diary.docs.length}
	<p class="diary-empty">还没有日记。</p>
{:else if diary.ready && !list.length}
	<p role="status" class="text-sm text-muted-foreground">已载入的日记缺少有效日期，无法列出。</p>
{/if}

<div class="diary-entries">
	{#each list as d, i (d.id)}
		<article class="diary-entry" aria-labelledby={`diary-title-${d.id}`}>
			<span class="menu-tab" aria-hidden="true">MENU <span>·</span> {String(list.length - i).padStart(2, "0")}</span>
			<div class="flex flex-wrap items-center gap-2">
				<time datetime={d.data.date} class="diary-date">{fmtDots(d.data.date)}</time>
				<Badge variant="secondary" class={d.data.kind === "apart" ? "diary-kind" : "diary-kind together"}>
					{d.data.kind === "apart" ? "各自的一天" : "见面的一天"}
				</Badge>
			</div>
			<h2 class="entry-title" id={`diary-title-${d.id}`}>{diaryTitle(d.data)}</h2>
			{#if d.data.place}
				<span class="entry-place"><MapPin aria-hidden="true" /><span>共享地点：{d.data.place}</span></span>
			{/if}
			<div class="diary-postcards">
				{#each ["yi", "jq"] as const as w (w)}
					<Postcard who={w} side={d.data[w]} date={d.data.date} mine={w === session.who}
						hasDraft={cardDrafts.has(d.id)} disabled={!diary.ready} onwrite={d.id === diaryAction.itemId ? undefined : () => start({ id: d.id })} />
				{/each}
			</div>
		</article>
	{/each}
</div>
</section>

{#if editor}
	<DiaryEditor target={editor} onclose={() => (editor = null)} onsaved={() => pudding?.cheer()} />
{/if}
