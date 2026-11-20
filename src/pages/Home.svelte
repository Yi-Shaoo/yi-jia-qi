<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import * as Popover from "$lib/components/ui/popover";
	import { Input } from "$lib/components/ui/input";
	import PaperCard from "$lib/components/diary/PaperCard.svelte";
	import { DatePickerCalendar } from "$lib/components/ui/date-picker";
	import EmptyState from "$lib/components/EmptyState.svelte";
	import Polaroid from "$lib/components/Polaroid.svelte";
	import { todayDiaryAction } from "$lib/components/diary/drafts";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { uploadPhoto, photoErrorMessage } from "$lib/upload";
	import WishButton from "$lib/components/WishButton.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import { pick } from "$lib/fx";
	import "$lib/components/home/candy.css";
	import { Card } from "$lib/components/ui/card";
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
	import Heart from "@lucide/svelte/icons/heart";
	import Sparkle from "@lucide/svelte/icons/sparkle";

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
	let heroInput = $state<HTMLInputElement | null>(null);
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

	const outings = [
		{ href: "/dates", title: "约会去哪", meta: `${DATES.length} 个推荐地点`, detail: "Irvine / Westwood / 中间点" },
		{ href: "/food", title: "今天吃什么", meta: `${FOOD.length} 家推荐餐厅`, detail: "拉面、烤肉、海边早午餐" },
		{ href: "/roadtrip", title: "Road-trip", meta: `${ROAD.length} 条路线`, detail: "Big Sur、Joshua Tree、Solvang…" },
		{ href: "/holiday", title: "感恩节和圣诞", meta: "11.26 · 12.25", detail: "瑞士冬日村、游船灯会" },
	];

	const doneWishes = $derived(wishes.docs.filter((d) => d.data.d).length);
</script>

<!-- 封面 -->
<section class="cover relative -mx-4 mt-1 md:mx-0 md:mt-2">
	<div class="cover-photo relative h-[clamp(10.5rem,52vw,16rem)] overflow-hidden bg-[#224957] md:h-[370px] md:rounded-3xl">
		{#if shared.hero}
			<img src={fileUrl(shared.hero)} alt="我们的封面照片" class="size-full object-cover object-[center_60%]" />
		{:else}
			<img src="/coast.svg" alt="" class="size-full object-cover object-[76%_center]" />
		{/if}
		<time class="cover-date" datetime="2026-11-05" aria-label="2026 年 11 月 5 日">'26 11 05</time>
		<Button
			variant="secondary"
			size="icon"
			aria-label={heroBusy ? "正在上传封面" : "换一张封面"}
			title={heroBusy ? "正在上传封面" : "换一张封面"}
			class="absolute top-3 right-3 z-[2] size-11 rounded-full bg-black/45 text-white hover:bg-black/65 md:top-6 md:right-6"
			disabled={heroBusy || !meta.ready}
			onclick={() => heroInput?.click()}
		>
			<ImageIcon aria-hidden="true" />
		</Button>
	</div>
	<div class="cover-signature">
		<h1 class="cover-name">Yi <span class="cover-and">&amp;</span> Jia Qi</h1>
		<p class="cover-caption">UCI ⇄ UCLA，405 号公路两头的我们</p>
		<Button href="/diary?write=today" class="cover-write md:hidden"><PenLine />{diaryAction.label}</Button>
	</div>
	<Input bind:ref={heroInput} type="file" accept="image/*" class="hidden" onchange={changeHero} />
</section>

<!-- 倒计时 -->
<section
	class="relative mx-0 mt-1 grid grid-cols-2 gap-2.5 md:mx-12 md:-mt-11 md:grid-cols-4"
	aria-label="倒计时"
>
	<div class="countdown-tile">
		<span class="font-display text-4xl leading-none font-extrabold text-coral md:text-[44px]">{together}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small></span>
		<span class="text-[13px] text-muted-foreground">在一起 · 从 11.05</span>
	</div>
	<div class="countdown-tile">
		<span class="font-display text-4xl leading-none font-extrabold md:text-[44px]">{met}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small></span>
		<span class="text-[13px] text-muted-foreground">认识 · 从 10.11</span>
	</div>
	<div class="countdown-tile">
		{#if holiday}
			<span class="font-display text-4xl leading-none font-extrabold md:text-[44px]">{holiday.n}<small class="ml-1 text-base font-semibold text-muted-foreground">天</small></span>
			<span class="text-[13px] text-muted-foreground">{holiday.label} · <span class="whitespace-nowrap">{fmtShort(holiday.date)} {weekday(holiday.date)}</span></span>
		{:else}
			<a href="/holiday" class="font-display text-2xl font-extrabold text-primary">节日活动 →</a>
			<span class="text-[13px] text-muted-foreground">2026 感恩节和圣诞</span>
		{/if}
	</div>
	<div class="countdown-tile">
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
				<Popover.Trigger disabled={!meta.ready} class="inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline decoration-primary/45 underline-offset-4 hover:decoration-primary">
					{shared.next ? `${fmtShort(shared.next)} ${weekday(shared.next)}` : "选个日期"}
				</Popover.Trigger>
				<Popover.Content class="w-auto gap-0 p-0" role="dialog" aria-label="下次见面日期">
					<DatePickerCalendar min={today} bind:value={nextValue} disabled={savingNext} />
					<div class="flex justify-end gap-2 border-t p-3">
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
		<Button variant="link" href="/diary">去日记 →</Button>
	</div>
	<div class="today-grid">
		{#if diary.status !== "ready"}<CollectionNotice status={diary.status} retry={() => diary.load()} label="今日日记" />{/if}
		{#each (diary.ready ? [me, otherOf(me)] : []) as w (w)}
			{@const text = sideText(w)}
			<PaperCard who={w} class="md:min-h-[200px]">
				<div class="today-head">
					<div class="min-w-0">
						<h3 class="today-sig">{WHO[w]}</h3>
						<small>的今天 · {fmtShort(today)}</small>
					</div>
					<span class="today-stamp" aria-hidden="true">
						{#if w === "yi"}<Heart />{:else}<Sparkle />{/if}
					</span>
				</div>
				{#if text}
					<p class="today-text">{text}</p>
				{:else}
					<div class="today-empty">
						{w === me && diaryAction.draftKey ? "有本机文字草稿" : `${WHO[w]} 今天还没写`}
					</div>
				{/if}
				{#if w === me && text && diaryAction.draftKey}
					<span class="today-draft">有本机文字草稿</span>
				{/if}
			</PaperCard>
		{/each}
		{#if daily.status !== "ready"}<CollectionNotice status={daily.status} retry={() => daily.load()} label="每日一问" />{/if}
		{#if daily.ready || dq}
			<a href="/play#daily" class="today-ticket">
				<span class="today-label">每日一问 · 今日甜点券</span>
				<span class="today-question">{question}</span>
				<span class="today-chips">
					{#each ["yi", "jq"] as const as w (w)}
						<span class="today-chip" class:answered={!!dq?.[w]?.t}><i aria-hidden="true"></i>{WHO[w]} {dq?.[w]?.t ? "已回答" : "还没答"}</span>
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
		<Button variant="link" href="/memories">全部回忆 →</Button>
	</div>
	<CollectionNotice status={memories.status} retry={() => memories.load()} label="回忆" />
	{#if recent.length}
		<div class="memories-shelf -mx-4 flex snap-x gap-6 overflow-x-auto px-6 pt-7 pb-8 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-7">
			{#each recent as entry, i (entry.id)}
				{@const m = entry.data}
				<a href={`/memories?item=${encodeURIComponent(entry.id)}`} class="w-[230px] min-w-0 shrink-0 snap-center self-start wrap-anywhere md:w-auto">
					{#if Array.isArray(m.photos) && m.photos[0]}
						<Polaroid src={fileUrl(m.photos[0])} alt="" stamp={filmStamp(m.date)} title={m.title} sub={m.text} tilt={TILTS[i]} />
					{:else}
						<Card variant="surface" class="flex min-h-40 flex-col items-start gap-2 p-5">
							<b class="line-clamp-2 font-display text-lg leading-snug wrap-anywhere">{m.title}</b>
							{#if m.text}<p class="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">{m.text}</p>{/if}
							<time datetime={m.date} class="mt-auto pt-4 font-mono text-xs text-muted-foreground">{fmtDots(m.date)}</time>
						</Card>
					{/if}
				</a>
			{/each}
		</div>
	{:else if memories.ready}
		<EmptyState message={memories.docs.length ? "现有回忆缺少有效日期或标题。" : "还没有回忆。"}>
			<Button variant="outline" href="/memories">{memories.docs.length ? "整理回忆" : "写下第一段"} →</Button>
		</EmptyState>
	{/if}
</section>

<!-- 出去玩 -->
<section aria-labelledby="outings-heading" class="pt-12">
	<h2 id="outings-heading" class="mb-5 text-[28px] font-bold md:text-[34px]">出去玩</h2>
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
		{#each outings as outing (outing.href)}
			<a href={outing.href} class="candy-box grid min-w-0 content-start gap-1.5 p-4 wrap-anywhere focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:p-5">
				<span class="font-display text-lg leading-snug font-bold md:text-xl">{outing.title}</span>
				<span class="font-mono text-xs">{outing.meta}</span>
				<span class="mt-1 text-[13px] leading-relaxed">{outing.detail}</span>
			</a>
		{/each}
	</div>
</section>

<!-- 灵感 -->
<section aria-labelledby="idea-heading" class="pt-12">
	<h2 id="idea-heading" class="mb-5 text-[28px] font-bold md:text-[34px]">今天的灵感</h2>
	<Card variant="surface" class="grid gap-4 p-5 md:p-6">
		<div aria-live="polite" aria-atomic="true" class="grid min-w-0 gap-1.5 wrap-anywhere">
			<h3 class="text-2xl leading-tight font-bold">{idea.text}</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">{idea.detail}</p>
		</div>
		<div class="grid grid-cols-2 gap-2 sm:justify-self-start">
			<Button variant="outline" onclick={() => (idea = pick(POOL.filter((item) => item.text !== idea.text)))}><Shuffle />换一个</Button>
			<WishButton text={idea.text} cat={idea.cat} size="default" variant="default" />
		</div>
	</Card>
</section>

<p class="mt-6 text-center text-[13px] text-muted-foreground">
	{#if wishes.ready && wishes.docs.length}心愿完成 {doneWishes} / {wishes.docs.length} · {/if}<Button href="/wish" variant="link">心愿清单 <ArrowRight /></Button>
</p>

<style>
	/* 同一天，两扇窗：日记页同款明信片 + 淡粉纸质的每日一问甜点券 */
	.today-grid {
		--quiet: var(--muted-foreground);
		--ticket: var(--muted);
		--ticket-deep: var(--secondary);
		--ticket-ink: var(--secondary-foreground);
		--ticket-line: color-mix(in srgb, var(--primary) 30%, transparent);
		--ticket-chip: var(--card);
		--grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .32 0 0 0 0 .22 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		display: grid;
		gap: 16px;
		min-width: 0;

	}
	.today-head {
		width: 100%;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
	}
	.today-head small {
		display: block;
		color: var(--quiet);
		font-size: 12px;
	}
	.today-sig {
		margin: 0;
		color: var(--sign);
		font: 400 1.45rem/1.3 Pacifico, "Brush Script MT", cursive;
		letter-spacing: 0;
	}
	.today-stamp {
		flex: none;
		display: grid;
		place-items: center;
		width: 34px;
		height: 42px;
		color: var(--paper);
		background: radial-gradient(var(--paper) 1px, transparent 1.3px) 0 0 / 6px 6px, var(--trim);
		mask: linear-gradient(#000 0 0) center / calc(100% - 5px) calc(100% - 5px) no-repeat,
			radial-gradient(circle, #000 2.8px, transparent 3px) center / 6px 6px;
	}
	.today-stamp :global(svg) {
		width: 16px;
		height: 16px;
		fill: currentColor;
		stroke-width: 1.5;
	}
	.today-text {
		margin: 0;
		font-size: 15px;
		line-height: 28px;
		white-space: pre-line;
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		overflow: hidden;
	}
	.today-empty {
		align-self: stretch;
		flex: 1;
		display: grid;
		place-items: center;
		min-height: 84px;
		padding: 12px;
		border: 1.5px dashed var(--trim);
		border-radius: 14px;
		background: var(--note);
		color: var(--note-ink);
		font-size: 14px;
		text-align: center;
	}
	.today-draft {
		margin-top: auto;
		color: var(--quiet);
		font-size: 12px;
	}
	.today-ticket {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
		min-height: 150px;
		padding: 20px 22px;
		border-radius: 16px;
		background: var(--grain) 0 0 / 180px, linear-gradient(160deg, var(--ticket), var(--ticket-deep));
		color: var(--ticket-ink);
		mask: radial-gradient(circle 9px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
			radial-gradient(circle 9px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
		transition: transform 0.2s;
	}
	.today-ticket::before {
		content: "";
		position: absolute;
		inset: 7px;
		border: 1.5px dashed var(--ticket-line);
		border-radius: 11px;
		pointer-events: none;
	}
	.today-ticket:hover {
		transform: translateY(-2px);
	}
	/* 缺口用的遮罩会裁掉外侧 outline，所以把焦点环画在券面内侧 */
	.today-ticket:focus-visible {
		outline: none;
	}
	.today-ticket:focus-visible::before {
		border: 2.5px solid currentColor;
	}
	.today-label {
		font: 600 11px/1.6 var(--font-mono, monospace);
		letter-spacing: 0.1em;
	}
	.today-question {
		font-family: var(--font-display, inherit);
		font-size: 22px;
		line-height: 1.4;
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.today-chips {
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 13px;
	}
	.today-chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border-radius: 99px;
		padding: 3px 11px;
		background: var(--ticket-chip);
	}
	.today-chip i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.35;
	}
	.today-chip.answered i {
		opacity: 1;
	}
	@media (min-width: 48rem) {
		.today-grid {
			grid-template-columns: 1fr 1fr 1.1fr;
		}
		.today-question {
			font-size: 24px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.today-ticket {
			transition: none;
		}
	}
	/* 倒计时：四颗马卡龙（草莓、开心果、柠檬、蓝莓），右上角各一枚小马卡龙 */
	.countdown-tile {
		--tile: #ffe1ea;
		--shell: #ff9fbb;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 1rem;
		border-radius: 22px;
		background: var(--tile);
		color: var(--foreground);
		box-shadow:
			inset 0 -4px 0 rgb(0 0 0 / 5%),
			0 0 0 2px var(--card),
			0 10px 22px rgb(150 70 90 / 12%);
	}
	.countdown-tile::after {
		content: "";
		position: absolute;
		top: 14px;
		right: 16px;
		width: 26px;
		height: 19px;
		border-radius: 45%;
		background: linear-gradient(var(--shell) 0 36%, var(--card) 36% 64%, var(--shell) 64%);
		box-shadow: 0 2px 0 rgb(0 0 0 / 6%);
	}
	.countdown-tile:nth-child(2) {
		--tile: #e1f3da;
		--shell: #a9dc9c;
	}
	.countdown-tile:nth-child(3) {
		--tile: #fff2c4;
		--shell: #ffd66b;
	}
	.countdown-tile:nth-child(4) {
		--tile: #e2ebff;
		--shell: #a9c1f5;
	}
	:global(.dark) .countdown-tile {
		--tile: #4a2c3a;
		--shell: #c4728f;
		box-shadow:
			inset 0 -4px 0 rgb(0 0 0 / 12%),
			0 0 0 2px var(--card),
			0 10px 22px rgb(0 0 0 / 30%);
	}
	:global(.dark) .countdown-tile:nth-child(2) {
		--tile: #2f4030;
		--shell: #7fae76;
	}
	:global(.dark) .countdown-tile:nth-child(3) {
		--tile: #4a4026;
		--shell: #c9a54c;
	}
	:global(.dark) .countdown-tile:nth-child(4) {
		--tile: #2c3652;
		--shell: #7f97cf;
	}
	.countdown-tile :global(.font-display) {
		font-family: Fredoka, var(--font-display);
		font-weight: 700;
	}
	.countdown-tile .text-coral {
		color: #d4557f;
	}
	:global(.dark) .countdown-tile .text-coral {
		color: #ffa9c2;
	}
	.countdown-tile .text-muted-foreground {
		color: #7b5960;
	}
	:global(.dark) .countdown-tile .text-muted-foreground {
		color: #e6cdd4;
	}
	/* 四张的说明行等高、垂直居中；「下次见面」的日期按钮保留 44px 热区 */
	.countdown-tile > span:last-child {
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: 0.25em;
		min-height: 44px;
	}
	@media (min-width: 48rem) {
		.countdown-tile {
			padding: 1.25rem 1.5rem;
		}
	}
	/* 小标题下面一条粉色波浪线 */
	h2 {
		position: relative;
		padding-bottom: 10px;
	}
	h2::after {
		content: "";
		position: absolute;
		left: 0;
		bottom: 0;
		width: 86px;
		height: 8px;
		background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='8'%3E%3Cpath d='M1 5q5-5 10 0t10 0' fill='none' stroke='%23ff9fbb' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E") repeat-x 0 0 / 22px 8px;
	}
	/* 回忆：拍立得铺在粉格子桌布上 */
	.memories-shelf {
		--gingham: rgb(255 168 196 / 28%);
		background:
			repeating-linear-gradient(0deg, var(--gingham) 0 18px, transparent 18px 36px),
			repeating-linear-gradient(90deg, var(--gingham) 0 18px, transparent 18px 36px),
			#fffaf8;
		border-radius: 26px;
		box-shadow: inset 0 0 0 2px #ffd3df;
	}
	:global(.dark) .memories-shelf {
		--gingham: rgb(196 114 143 / 16%);
		background:
			repeating-linear-gradient(0deg, var(--gingham) 0 18px, transparent 18px 36px),
			repeating-linear-gradient(90deg, var(--gingham) 0 18px, transparent 18px 36px),
			#2b2228;
		box-shadow: inset 0 0 0 2px #4a3a43;
	}
	.memories-shelf :global(.polaroid) {
		box-shadow: 0 2px 3px rgb(90 40 50 / 12%), 0 14px 24px rgb(150 70 90 / 16%);
	}
	/* 出去玩：四只马卡龙色糖果盒，虚线盒边 */
	.candy-box {
		--box: #e2ebff;
		--box-ink: #34508f;
		position: relative;
		border-radius: 22px;
		background: var(--box);
		color: var(--box-ink);
		box-shadow: inset 0 -4px 0 rgb(0 0 0 / 5%), 0 8px 18px rgb(150 70 90 / 10%);
	}
	.candy-box::before {
		content: "";
		position: absolute;
		inset: 7px;
		border: 1.5px dashed rgb(255 255 255 / 85%);
		border-radius: 16px;
		pointer-events: none;
	}
	.candy-box:nth-child(2) {
		--box: #ffe1ea;
		--box-ink: #9c2f57;
	}
	.candy-box:nth-child(3) {
		--box: #fff2c4;
		--box-ink: #7a5a12;
	}
	.candy-box:nth-child(4) {
		--box: #e1f3da;
		--box-ink: #3d6b3a;
	}
	:global(.dark) .candy-box {
		--box: #2c3652;
		--box-ink: #c9d8ff;
		box-shadow: inset 0 -4px 0 rgb(0 0 0 / 12%), 0 8px 18px rgb(0 0 0 / 25%);
	}
	:global(.dark) .candy-box::before {
		border-color: rgb(255 255 255 / 16%);
	}
	:global(.dark) .candy-box:nth-child(2) {
		--box: #4a2c3a;
		--box-ink: #ffc6d6;
	}
	:global(.dark) .candy-box:nth-child(3) {
		--box: #4a4026;
		--box-ink: #f6dc94;
	}
	:global(.dark) .candy-box:nth-child(4) {
		--box: #2f4030;
		--box-ink: #c4e8ba;
	}
	/* 封面：照片保持原色；桌面签名压在照片左下，只在那一角加一层很轻的暗角 */
	.cover {
		--left: clamp(24px, 2.6vw, 30px);
		--offset: clamp(72px, 12.5vw, 145px);
	}
	.cover-date {
		position: absolute;
		z-index: 1;
		bottom: 12px;
		left: 16px;
		color: var(--stamp);
		font: 500 0.875rem/1.25 var(--font-mono);
		letter-spacing: 0.06em;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 5px rgb(232 131 58 / 45%), 0 1px 2px rgb(58 30 13 / 42%);
	}
	.cover-signature {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 4px 8px;
		padding: 8px 16px 15px;
	}
	/* 奶油花边相框：奶油白边 + 粉色外圈 + 内侧一圈白色缝线 */
	.cover-photo {
		margin: 0 12px;
		border: 5px solid var(--card);
		border-radius: 22px;
		outline: 2px dashed rgb(255 255 255 / 80%);
		outline-offset: -14px;
		box-shadow: 0 0 0 2px #ffc2d4, 0 10px 22px rgb(212 85 127 / 16%);
	}
	:global(.dark) .cover-photo {
		box-shadow: 0 0 0 2px #8f4f67, 0 10px 22px rgb(0 0 0 / 30%);
	}
	@media (min-width: 48rem) {
		.cover-photo {
			margin: 0;
			border-width: 7px;
			border-radius: 28px;
			box-shadow: 0 0 0 2px #ffc2d4, 0 18px 34px rgb(212 85 127 / 18%);
		}
		:global(.dark) .cover-photo {
			box-shadow: 0 0 0 2px #8f4f67, 0 18px 34px rgb(0 0 0 / 35%);
		}
	}
	.cover-name {
		margin: 0;
		width: fit-content;
		max-width: 100%;
		color: var(--candy-logo, var(--foreground));
		font: 400 clamp(1.64rem, 7.8vw, 2.15rem)/1.49 Pacifico, "Brush Script MT", cursive;
		letter-spacing: -0.035em;
		font-synthesis: none;
		white-space: nowrap;
	}
	.cover-and {
		display: inline-block;
		margin: 0 0.1em;
		font-size: 0.46em;
		line-height: 1;
		letter-spacing: 0;
		vertical-align: 0.12em;
	}
	.cover-caption {
		grid-column: 1 / -1;
		grid-row: 2;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
		letter-spacing: 0.04em;
	}
	.cover-signature > :global(.cover-write) {
		grid-column: 2;
		grid-row: 1;
	}
	@media (min-width: 48rem) {
		.cover-photo::after {
			content: "";
			position: absolute;
			inset: 0;
			pointer-events: none;
			background: radial-gradient(ellipse 52% 70% at 0% 100%, rgb(18 22 28 / 58%), rgb(18 22 28 / 28%) 55%, transparent 100%);
		}
		.cover-date {
			left: var(--left);
			bottom: var(--offset);
			font-size: clamp(0.95rem, 1.3vw, 1.05rem);
		}
		.cover-signature {
			position: absolute;
			z-index: 1;
			top: calc(100% - var(--offset) + 2px);
			left: var(--left);
			display: block;
			width: max-content;
			max-width: 44%;
			padding: 0;
		}
		.cover-name {
			color: #fff;
			font-size: clamp(43px, 4vw, 51px);
			line-height: 1.2;
			text-shadow: 0 1px 2px rgb(0 0 0 / 30%);
		}
		.cover-caption {
			margin-top: 3px;
			color: rgb(255 255 255 / 92%);
			font-size: 14px;
			letter-spacing: 0.045em;
			text-shadow: 0 1px 2px rgb(0 0 0 / 40%);
		}
	}
	@media (min-width: 48rem) and (max-width: 63.99rem) {
		.cover {
			--offset: clamp(135px, 15.2vw, 145px);
		}
		.cover-caption {
			font-size: 13px;
		}
	}
</style>
