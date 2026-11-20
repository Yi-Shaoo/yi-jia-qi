<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import * as Popover from "$lib/components/ui/popover";
	import { Input } from "$lib/components/ui/input";
	import Polaroid from "$lib/components/Polaroid.svelte";
	import WhoBadge from "$lib/components/WhoBadge.svelte";
	import { todayDiaryAction } from "$lib/components/diary/drafts";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { uploadPhoto, photoErrorMessage } from "$lib/upload";
	import WishButton from "$lib/components/WishButton.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import { pick } from "$lib/fx";
	import { questionFor } from "$lib/daily";
	import { localDay } from "$lib/local-day";
	import { groupMemories } from "$lib/memory-timeline";
	import { DATES, FOOD, ROAD, THANKS, XMAS } from "$lib/data/content";
	import {
		MET_SINCE,
		TOGETHER_SINCE,
		dayCount,
		dayDiff,
		filmStamp,
		fmtDots,
		fmtShort,
		isDateKey,
		weekday,
	} from "$lib/dates";
	import { WHO, otherOf, type SharedMeta, type Who } from "$lib/types";
	import ImageIcon from "@lucide/svelte/icons/image";
	import PenLine from "@lucide/svelte/icons/pen-line";
	import Shuffle from "@lucide/svelte/icons/shuffle";
	import ArrowRight from "@lucide/svelte/icons/arrow-right";

	const meta = useCollection("meta");
	const diary = useCollection("diary");
	const daily = useCollection("daily");
	const memories = useCollection("memories");
	const wishes = useCollection("wishes");

	const today = $derived($localDay);
	const shared = $derived(meta.get("shared")?.data ?? {});
	const me = $derived(session.who as Who);

	// —— 倒计时 ——
	const together = dayCount(TOGETHER_SINCE);
	const met = dayCount(MET_SINCE);
	const holiday = (() => {
		const a = dayDiff(THANKS.date);
		if (a >= 0) return { n: a, label: "感恩节", date: THANKS.date };
		const b = dayDiff(XMAS.date);
		if (b >= 0) return { n: b, label: "圣诞节", date: XMAS.date };
		return null;
	})();
	const nextDays = $derived(shared.next ? dayDiff(shared.next) : null);

	function saveShared(patch: SharedMeta) {
		return meta.get("shared") ? meta.update("shared", patch) : meta.set("shared", patch);
	}

	let nextOpen = $state(false);
	let nextValue = $state("");
	let savingNext = $state(false);
	$effect(() => {
		if (nextOpen) nextValue = shared.next ?? "";
	});
	async function saveNext(value: string) {
		if (savingNext || (value && (!isDateKey(value) || value < today))) return;
		savingNext = true;
		try {
			await saveShared({ next: value });
			nextOpen = false;
			toast.success(value ? "下次见面的日子定好啦" : "已清空");
		} catch {
			toast.error("没存上，再试一次");
		} finally {
			savingNext = false;
		}
	}

	// —— 封面 ——
	let heroInput: HTMLInputElement;
	let heroBusy = $state(false);
	async function changeHero(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		(e.currentTarget as HTMLInputElement).value = "";
		if (!f) return;
		heroBusy = true;
		try {
			const id = await uploadPhoto(f);
			await saveShared({ hero: id });
			toast.success("封面换好了");
		} catch (error) {
			toast.error(photoErrorMessage(error));
		} finally {
			heroBusy = false;
		}
	}

	// —— 今天 ——
	const diaryAction = $derived(todayDiaryAction(diary, session.who, today));
	const sideText = (w: Who) => {
		const s = diaryAction.entry?.[w];
		return s?.t?.trim() || s?.fav?.trim() || (s?.photo ? "（放了一张照片）" : "");
	};
	const dq = $derived(daily.get(today)?.data);
	const question = $derived(dq?.q || questionFor(today));

	// —— 回忆 ——
	const recent = $derived(groupMemories(memories.docs).timeline.slice(0, 4));
	const TILTS = [-2, 1.5, -1, 2];

	// —— 灵感 ——
	const POOL = [
		...DATES.map((d) => ({ text: d.name, detail: d.desc, cat: "place" as const })),
		...FOOD.map((d) => ({ text: `去吃 ${d.name}`, detail: d.desc, cat: "food" as const })),
		...ROAD.map((d) => ({ text: `Road-trip：${d.name}`, detail: d.stops.join(" → "), cat: "place" as const })),
	];
	let idea = $state(pick(POOL));

	const doneWishes = $derived(wishes.docs.filter((d) => d.data.d).length);
</script>

<!-- 封面 -->
<section class="relative -mx-4 mt-1 h-[274px] overflow-hidden bg-[#224957] md:mx-0 md:mt-2 md:h-[370px] md:rounded-3xl">
	{#if shared.hero}
		<img src={fileUrl(shared.hero)} alt="我们的封面照片" class="size-full object-cover object-[center_60%]" />
	{:else}
		<img src="/coast.svg" alt="" class="size-full object-cover object-[76%_center]" />
	{/if}
	<div class="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_24_40/.79),rgb(10_24_40/.49)_60%,transparent),linear-gradient(0deg,rgb(10_24_40/.42),transparent_80%)] md:bg-[linear-gradient(90deg,rgb(10_24_40/.8),rgb(10_24_40/.56)_43%,transparent_78%)]"></div>
	<div class="absolute bottom-14 left-5 text-white md:bottom-20 md:left-12">
		<div class="film-stamp mb-2 text-sm md:text-xl">'26 11 05</div>
		<h1 class="font-display text-[44px] leading-[0.95] font-extrabold text-white md:text-[88px]">Yi &amp; Jia Qi</h1>
		<p class="mt-2 text-[15px] md:mt-3 md:text-lg">UCI ⇄ UCLA，405 号公路两头的我们</p>
		<Button href="/diary?write=today" variant="secondary" class="mt-4 rounded-full bg-white px-4 text-[#14253d] hover:bg-white/90 md:hidden"><PenLine />{diaryAction.label}</Button>
	</div>
	<input bind:this={heroInput} type="file" accept="image/*" class="hidden" onchange={changeHero} />
	<Button
		variant="secondary"
		size="icon"
		aria-label={heroBusy ? "正在上传封面" : "换一张封面"}
		title={heroBusy ? "正在上传封面" : "换一张封面"}
		class="absolute top-3 right-3 size-11 rounded-full bg-black/45 text-white hover:bg-black/65 md:top-6 md:right-6"
		disabled={heroBusy || !meta.ready}
		onclick={() => heroInput.click()}
	>
		<ImageIcon aria-hidden="true" />
	</Button>
</section>

<!-- 倒计时 -->
<section
	class="relative mx-0 -mt-10 grid grid-cols-2 overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_var(--border),0_12px_30px_rgb(20_37_61/0.08)] md:mx-12 md:-mt-11 md:grid-cols-4"
	aria-label="倒计时"
>
	<div class="flex flex-col gap-0.5 border-b border-r p-4 md:border-b-0 md:px-6 md:py-5">
		<span class="font-display text-4xl leading-none font-extrabold text-coral md:text-[44px]">{together}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small></span>
		<span class="text-[13px] text-muted-foreground">在一起 · 从 11.05</span>
	</div>
	<div class="flex flex-col gap-0.5 border-b p-4 md:border-b-0 md:border-r md:px-6 md:py-5">
		<span class="font-display text-4xl leading-none font-extrabold md:text-[44px]">{met}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small></span>
		<span class="text-[13px] text-muted-foreground">认识 · 从 10.11</span>
	</div>
	<div class="flex flex-col gap-0.5 border-r p-4 md:px-6 md:py-5">
		{#if holiday}
			<span class="font-display text-4xl leading-none font-extrabold md:text-[44px]">{holiday.n}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small></span>
			<span class="text-[13px] text-muted-foreground">{holiday.label} · <span class="whitespace-nowrap">{fmtShort(holiday.date)} {weekday(holiday.date)}</span></span>
		{:else}
			<a href="/holiday" class="font-display text-2xl font-extrabold text-sea">节日活动 →</a>
			<span class="text-[13px] text-muted-foreground">2026 感恩节和圣诞</span>
		{/if}
	</div>
	<div class="flex flex-col gap-0.5 p-4 md:px-6 md:py-5">
		{#if nextDays === null}
			<span class="font-display text-4xl leading-none font-extrabold text-muted-foreground/50 md:text-[44px]">—</span>
		{:else}
			<span class="font-display text-4xl leading-none font-extrabold md:text-[44px]">
				{#if nextDays > 0}{nextDays}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small>{:else if nextDays === 0}今天{:else}见过啦{/if}
			</span>
		{/if}
		<span class="text-[13px] text-muted-foreground">
			下次见面 ·
			<Popover.Root bind:open={nextOpen}>
				<Popover.Trigger disabled={!meta.ready} class="inline-flex min-h-11 items-center rounded-sm font-medium text-sea underline decoration-sea/45 underline-offset-4 hover:decoration-sea">
					{shared.next ? `${fmtShort(shared.next)} ${weekday(shared.next)}` : "选个日期"}
				</Popover.Trigger>
				<Popover.Content class="flex w-64 flex-col gap-3">
					<label class="flex flex-col gap-1.5 text-sm font-medium">
						下次见面是哪天？
						<Input type="date" min={today} bind:value={nextValue} disabled={savingNext} />
					</label>
					<div class="flex justify-end gap-2">
						{#if shared.next}<Button variant="ghost" size="sm" onclick={() => saveNext("")} disabled={savingNext}>清空</Button>{/if}
						<Button size="sm" onclick={() => saveNext(nextValue)} disabled={savingNext || !isDateKey(nextValue) || nextValue < today}>保存</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</span>
	</div>
</section>

{#if meta.status === "error"}<CollectionNotice status={meta.status} retry={() => meta.load()} label="封面和见面日期" />{/if}

<!-- 今天 -->
<section class="pt-12 md:pt-14">
	<div class="mb-5 flex items-end justify-between gap-4">
		<div>
			<span class="eyebrow">{fmtShort(today)} {weekday(today)}</span>
			<h2 class="mt-2 text-[28px] font-bold md:text-[34px]">同一天，两扇窗</h2>
		</div>
		<a href="/diary" class="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-sea">去日记 →</a>
	</div>
	<div class="grid gap-4 md:grid-cols-[1fr_1fr_1.1fr]">
		{#if diary.status !== "ready"}<CollectionNotice status={diary.status} retry={() => diary.load()} label="今日日记" />{/if}
		{#each (diary.ready ? [me, otherOf(me)] : []) as w (w)}
			{@const text = sideText(w)}
			<div class="surface-card flex min-h-[200px] flex-col gap-3 p-5">
				<div class="flex items-center gap-2.5 font-semibold"><WhoBadge who={w} />{WHO[w]} 的今天</div>
				{#if text}
					<p class="line-clamp-4 flex-1 text-[15px] leading-relaxed whitespace-pre-line">{text}</p>
				{:else}
					<div class="flex flex-1 items-center justify-center rounded-xl bg-muted/60 text-sm text-muted-foreground">
						{w === me && diaryAction.draftKey ? "有本机文字草稿" : `${WHO[w]} 今天还没写`}
					</div>
				{/if}
				{#if w === me && text && diaryAction.draftKey}
					<span class="text-xs text-muted-foreground">有本机文字草稿</span>
				{/if}
			</div>
		{/each}
		{#if daily.status !== "ready"}<CollectionNotice status={daily.status} retry={() => daily.load()} label="每日一问" />{/if}
		{#if daily.ready || dq}
			<a href="/play#daily" class="flex min-w-0 flex-col gap-3 rounded-xl bg-sea p-6 text-white transition-transform hover:-translate-y-0.5 dark:bg-[#183447] dark:text-[#e1eff9]">
				<span class="font-mono text-xs tracking-[0.08em] text-[#ffcf9e] uppercase">每日一问</span>
				<span class="font-display text-[22px] leading-snug font-bold wrap-anywhere md:text-[26px]">{question}</span>
				<span class="mt-auto flex flex-wrap gap-2 text-[13px]">
					{#each ["yi", "jq"] as const as w (w)}
						<span class="rounded-full bg-white/15 px-3 py-1">{WHO[w]} {dq?.[w]?.t ? "已回答" : "还没答"}</span>
					{/each}
				</span>
			</a>
		{/if}
	</div>
</section>

<!-- 回忆 -->
<section class="pt-14">
	<div class="mb-5 flex items-end justify-between gap-4">
		<h2 class="text-[28px] font-bold md:text-[34px]">我们的回忆</h2>
		<a href="/memories" class="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-sea">全部回忆 →</a>
	</div>
	<CollectionNotice status={memories.status} retry={() => memories.load()} label="回忆" />
	{#if recent.length}
		<div class="-mx-4 flex snap-x gap-6 overflow-x-auto px-6 pt-2 pb-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-2">
			{#each recent as entry, i (entry.id)}
				{@const m = entry.data}
				<a href={`/memories?item=${encodeURIComponent(entry.id)}`} class="w-[230px] min-w-0 shrink-0 snap-center self-start wrap-anywhere md:w-auto">
					{#if Array.isArray(m.photos) && m.photos[0]}
						<Polaroid src={fileUrl(m.photos[0])} alt="" stamp={filmStamp(m.date)} title={m.title} sub={m.text} tilt={TILTS[i]} />
					{:else}
						<div class="surface-card flex min-h-40 flex-col items-start gap-2 p-5">
							<b class="line-clamp-2 font-display text-lg leading-snug wrap-anywhere">{m.title}</b>
							{#if m.text}<p class="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">{m.text}</p>{/if}
							<time datetime={m.date} class="mt-auto pt-4 font-mono text-xs text-muted-foreground">{fmtDots(m.date)}</time>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{:else if memories.ready}
		<p class="surface-card p-6 text-muted-foreground">
			{memories.docs.length ? "现有回忆缺少有效日期或标题。" : "还没有回忆。"}
			<a href="/memories" class="inline-flex min-h-11 items-center font-medium text-sea">{memories.docs.length ? "整理回忆" : "写下第一段"} →</a>
		</p>
	{/if}
</section>

<!-- 出去玩 -->
<section class="pt-12">
	<h2 class="mb-5 text-[28px] font-bold md:text-[34px]">出去玩</h2>
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
		<a href="/dates" class="flex min-h-[150px] flex-col gap-1.5 rounded-xl bg-sea-soft p-5 text-[#173f5a] dark:text-sea md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">{DATES.length} 个推荐地点</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">约会去哪</span>
			<span class="text-[13px] opacity-85">Irvine / Westwood / 中间点</span>
		</a>
		<a href="/food" class="flex min-h-[150px] flex-col gap-1.5 rounded-xl bg-coral-soft p-5 text-[#7d2a1f] dark:text-coral md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">{FOOD.length} 家推荐餐厅</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">今天吃什么</span>
			<span class="text-[13px] opacity-85">拉面、烤肉、海边早午餐</span>
		</a>
		<a href="/roadtrip" class="flex min-h-[150px] flex-col gap-1.5 rounded-xl bg-sand p-5 text-sand-ink md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">{ROAD.length} 条路线</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">Road-trip</span>
			<span class="text-[13px] opacity-85">Big Sur、Joshua Tree、Solvang…</span>
		</a>
		<a href="/holiday" class="flex min-h-[150px] flex-col gap-1.5 rounded-xl bg-mint-soft p-5 text-mint-ink md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">11.26 · 12.25</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">感恩节和圣诞</span>
			<span class="text-[13px] opacity-85">瑞士冬日村、游船灯会</span>
		</a>
	</div>
</section>

<!-- 灵感 -->
<section class="surface-card mt-12 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
	<div class="min-w-0">
		<span class="eyebrow">今天的灵感</span>
		<h3 class="mt-2 text-xl font-bold">{idea.text}</h3>
		<p class="mt-1 text-sm text-muted-foreground">{idea.detail}</p>
	</div>
	<div class="flex shrink-0 gap-2">
		<Button variant="outline" class="rounded-full" onclick={() => (idea = pick(POOL))}><Shuffle />换一个</Button>
		<WishButton text={idea.text} cat={idea.cat} label="加入心愿" />
	</div>
</section>

<p class="mt-6 text-center text-[13px] text-muted-foreground">
	{#if wishes.ready && wishes.docs.length}心愿完成 {doneWishes} / {wishes.docs.length} · {/if}<a href="/wish" class="inline-flex min-h-11 items-center gap-1 text-sea">心愿清单 <ArrowRight class="inline size-3" /></a>
</p>
