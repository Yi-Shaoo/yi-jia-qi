<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import * as Popover from "$lib/components/ui/popover";
	import { Input } from "$lib/components/ui/input";
	import Polaroid from "$lib/components/Polaroid.svelte";
	import WhoBadge from "$lib/components/WhoBadge.svelte";
	import { fileUrl } from "$lib/api";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { uploadPhoto } from "$lib/upload";
	import { addWish } from "$lib/wishes.svelte";
	import { pick } from "$lib/fx";
	import { questionFor } from "$lib/daily";
	import { DATES, FOOD, ROAD, THANKS, XMAS } from "$lib/data/content";
	import {
		MET_SINCE,
		TOGETHER_SINCE,
		dayCount,
		dayDiff,
		filmStamp,
		fmtShort,
		todayKey,
		weekday,
	} from "$lib/dates";
	import { WHO, otherOf, type Who } from "$lib/types";
	import ImageIcon from "@lucide/svelte/icons/image";
	import PenLine from "@lucide/svelte/icons/pen-line";
	import Shuffle from "@lucide/svelte/icons/shuffle";
	import Star from "@lucide/svelte/icons/star";
	import ArrowRight from "@lucide/svelte/icons/arrow-right";

	const meta = useCollection("meta");
	const diary = useCollection("diary");
	const daily = useCollection("daily");
	const memories = useCollection("memories");
	const wishes = useCollection("wishes");

	const today = todayKey();
	const shared = $derived(meta.get("shared")?.data ?? {});
	const me = $derived(session.who as Who);

	// —— 倒计时 ——
	const together = dayCount(TOGETHER_SINCE);
	const met = dayCount(MET_SINCE);
	const holiday = (() => {
		const a = dayDiff(THANKS.date);
		if (a >= 0) return { n: a, label: `感恩节 · ${fmtShort(THANKS.date)} ${weekday(THANKS.date)}` };
		const b = dayDiff(XMAS.date);
		if (b >= 0) return { n: b, label: `圣诞节 · ${fmtShort(XMAS.date)} ${weekday(XMAS.date)}` };
		return null;
	})();
	const nextDays = $derived(shared.next ? dayDiff(shared.next) : null);

	let nextOpen = $state(false);
	let nextValue = $state("");
	$effect(() => {
		if (nextOpen) nextValue = shared.next ?? "";
	});
	async function saveNext() {
		try {
			await meta.set("shared", { ...shared, next: nextValue || undefined });
			nextOpen = false;
			toast.success(nextValue ? "下次见面的日子定好啦" : "已清空");
		} catch {
			toast.error("没存上，再试一次");
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
			await meta.set("shared", { ...shared, hero: id });
			toast.success("封面换好了");
		} catch {
			toast.error("照片没传上去，换一张试试");
		} finally {
			heroBusy = false;
		}
	}

	// —— 今天 ——
	const todayDiary = $derived(
		diary.docs.filter((d) => d.data.date === today).sort((a, b) => a.data.c - b.data.c)[0]?.data,
	);
	const sideText = (w: Who) => {
		const s = todayDiary?.[w];
		return s ? s.t || s.fav || (s.photo ? "（放了一张照片）" : "") : "";
	};
	const dq = $derived(daily.get(today)?.data);
	const question = questionFor(today);

	// —— 回忆 ——
	const recent = $derived(
		memories.docs
			.map((d) => d.data)
			.filter((m) => m.photos?.length)
			.sort((a, b) => (a.date < b.date ? 1 : -1))
			.slice(0, 4),
	);
	const TILTS = [-2, 1.5, -1, 2];

	// —— 灵感 ——
	const POOL = [
		...DATES.map((d) => [d.name, d.desc]),
		...FOOD.map((d) => [`去吃 ${d.name}`, d.desc]),
		...ROAD.map((d) => [`Road-trip：${d.name}`, d.stops.join(" → ")]),
	];
	let idea = $state(pick(POOL));

	const doneWishes = $derived(wishes.docs.filter((d) => d.data.d).length);
</script>

<!-- 封面 -->
<section class="relative -mx-4 mt-1 h-[340px] overflow-hidden md:mx-0 md:mt-2 md:h-[540px] md:rounded-[28px]">
	{#if shared.hero}
		<img src={fileUrl(shared.hero)} alt="我们的封面照片" class="size-full object-cover object-[center_60%]" />
	{:else}
		<div class="size-full bg-[linear-gradient(180deg,#bfe0f2_0%,#e3eef5_55%,#f6ead2_100%)] dark:bg-[linear-gradient(180deg,#123049,#17303f_55%,#2e2717)]"></div>
	{/if}
	<div class="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_24_40/0)_40%,rgb(10_24_40/0.62)_100%)]"></div>
	<div class="absolute bottom-16 left-5 text-white md:bottom-24 md:left-12">
		<div class="film-stamp mb-2 text-sm md:text-xl">'26 11 05</div>
		<h1 class="font-display text-[44px] leading-[0.95] font-extrabold text-white md:text-[88px]">Yi &amp; Jia Qi</h1>
		<p class="mt-2 text-[15px] opacity-90 md:mt-3 md:text-lg">UCI ⇄ UCLA，405 号公路两头的我们</p>
	</div>
	<input bind:this={heroInput} type="file" accept="image/*" class="hidden" onchange={changeHero} />
	<Button
		variant="secondary"
		size="sm"
		class="absolute top-4 right-4 rounded-full bg-white/90 text-[#14253d] hover:bg-white md:top-7 md:right-7"
		disabled={heroBusy}
		onclick={() => heroInput.click()}
	>
		<ImageIcon />{heroBusy ? "上传中…" : "换一张封面"}
	</Button>
</section>

<!-- 倒计时 -->
<section
	class="relative mx-0 -mt-10 grid grid-cols-2 overflow-hidden rounded-[20px] bg-card shadow-[0_0_0_1px_var(--border),0_12px_30px_rgb(20_37_61/0.08)] md:mx-12 md:-mt-11 md:grid-cols-4"
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
			<span class="text-[13px] text-muted-foreground">{holiday.label}</span>
		{:else}
			<span class="font-display text-3xl leading-none font-extrabold">新年快乐</span>
			<span class="text-[13px] text-muted-foreground">今年的节日都过完啦</span>
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
				<Popover.Trigger class="font-medium text-sea underline-offset-4 hover:underline">
					{shared.next ? `${fmtShort(shared.next)} ${weekday(shared.next)}` : "选个日期"}
				</Popover.Trigger>
				<Popover.Content class="flex w-64 flex-col gap-3">
					<label class="flex flex-col gap-1.5 text-sm font-medium">
						下次见面是哪天？
						<Input type="date" min={today} bind:value={nextValue} />
					</label>
					<div class="flex justify-end gap-2">
						{#if shared.next}<Button variant="ghost" size="sm" onclick={() => { nextValue = ""; saveNext(); }}>清空</Button>{/if}
						<Button size="sm" onclick={saveNext} disabled={!nextValue}>保存</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</span>
	</div>
</section>

<!-- 今天 -->
<section class="pt-12 md:pt-14">
	<div class="mb-5 flex items-end justify-between gap-4">
		<div>
			<span class="eyebrow">Today · {fmtShort(today)} {weekday(today)}</span>
			<h2 class="mt-2 text-[28px] font-bold md:text-[34px]">同一天，两扇窗</h2>
		</div>
		<a href="/diary" class="text-sm font-medium text-sea">去日记 →</a>
	</div>
	<div class="grid gap-4 md:grid-cols-[1fr_1fr_1.1fr]">
		{#each [me, otherOf(me)] as w (w)}
			{@const text = sideText(w)}
			<div class="flex min-h-[200px] flex-col gap-3 rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--border)]">
				<div class="flex items-center gap-2.5 font-semibold"><WhoBadge who={w} />{WHO[w]} 的今天</div>
				{#if text}
					<p class="line-clamp-4 flex-1 text-[15px] leading-relaxed whitespace-pre-line">{text}</p>
				{:else}
					<div class="flex flex-1 items-center justify-center rounded-xl bg-muted/60 text-sm text-muted-foreground">
						{w === me ? "一句话就够" : `${WHO[w]} 今天还没写`}
					</div>
				{/if}
				{#if w === me}
					<Button href="/diary?write=today" class="self-end rounded-full"><PenLine />{text ? "改我的这一边" : "写下今天"}</Button>
				{/if}
			</div>
		{/each}
		<a href="/play#daily" class="flex flex-col gap-3 rounded-[20px] bg-sea p-6 text-white transition-transform hover:-translate-y-0.5 dark:text-[#0c1320]">
			<span class="font-mono text-xs tracking-[0.08em] text-[#ffcf9e] uppercase dark:text-[#7a3b10]">每日一问</span>
			<span class="font-display text-[22px] leading-snug font-bold md:text-[26px]">{question}</span>
			<span class="mt-auto flex flex-wrap gap-2 text-[13px]">
				{#each ["yi", "jq"] as const as w (w)}
					<span class="rounded-full bg-white/15 px-3 py-1">{WHO[w]} {dq?.[w]?.t ? "已回答" : "还没答"}</span>
				{/each}
			</span>
		</a>
	</div>
</section>

<!-- 回忆 -->
<section class="pt-14">
	<div class="mb-5 flex items-end justify-between gap-4">
		<div>
			<span class="eyebrow">Our timeline · since 10.11</span>
			<h2 class="mt-2 text-[28px] font-bold md:text-[34px]">我们的回忆</h2>
		</div>
		<a href="/memories" class="text-sm font-medium text-sea">全部回忆 →</a>
	</div>
	{#if recent.length}
		<div class="-mx-4 flex snap-x gap-6 overflow-x-auto px-6 pt-2 pb-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-2">
			{#each recent as m, i (m.title + m.date)}
				<a href="/memories" class="w-[230px] shrink-0 snap-center md:w-auto">
					<Polaroid src={fileUrl(m.photos[0])} alt={m.title} stamp={filmStamp(m.date)} title={m.title} sub={m.text} tilt={TILTS[i]} />
				</a>
			{/each}
		</div>
	{:else}
		<p class="rounded-2xl bg-card p-6 text-muted-foreground shadow-[0_0_0_1px_var(--border)]">
			还没有带照片的回忆。<a href="/memories" class="font-medium text-sea">去写下第一段 →</a>
		</p>
	{/if}
</section>

<!-- 出去玩 -->
<section class="pt-12">
	<div class="mb-5">
		<span class="eyebrow">Go out</span>
		<h2 class="mt-2 text-[28px] font-bold md:text-[34px]">出去玩</h2>
	</div>
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
		<a href="/dates" class="flex min-h-[150px] flex-col gap-1.5 rounded-[20px] bg-sea-soft p-5 text-[#173f5a] dark:text-sea md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">{DATES.length} PLACES</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">约会去哪</span>
			<span class="text-[13px] opacity-85">Irvine / Westwood / 中间点</span>
		</a>
		<a href="/food" class="flex min-h-[150px] flex-col gap-1.5 rounded-[20px] bg-coral-soft p-5 text-[#7d2a1f] dark:text-coral md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">{FOOD.length} SPOTS</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">今天吃什么</span>
			<span class="text-[13px] opacity-85">拉面、烤肉、海边早午餐</span>
		</a>
		<a href="/roadtrip" class="flex min-h-[150px] flex-col gap-1.5 rounded-[20px] bg-sand p-5 text-sand-ink md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em]">{ROAD.length} ROUTES</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">Road-trip</span>
			<span class="text-[13px] opacity-85">Big Sur、Joshua Tree、Solvang…</span>
		</a>
		<a href="/holiday" class="flex min-h-[150px] flex-col gap-1.5 rounded-[20px] bg-night p-5 text-night-ink md:min-h-[170px]">
			<span class="font-mono text-xs tracking-[0.06em] text-[#ffb27a] dark:text-[#b4501a]">11.26 · 12.25</span>
			<span class="mt-auto font-display text-xl font-bold md:text-[22px]">感恩节和圣诞</span>
			<span class="text-[13px] opacity-85">瑞士冬日村、游船灯会</span>
		</a>
	</div>
</section>

<!-- 灵感 -->
<section class="mt-12 flex flex-col gap-4 rounded-[20px] bg-card p-6 shadow-[0_0_0_1px_var(--border)] md:flex-row md:items-center md:justify-between">
	<div class="min-w-0">
		<span class="eyebrow">今天的灵感</span>
		<h3 class="mt-2 text-xl font-bold">{idea[0]}</h3>
		<p class="mt-1 text-sm text-muted-foreground">{idea[1]}</p>
	</div>
	<div class="flex shrink-0 gap-2">
		<Button variant="outline" class="rounded-full" onclick={() => (idea = pick(POOL))}><Shuffle />换一个</Button>
		<Button class="rounded-full" onclick={() => addWish(idea[0])}><Star />加入心愿</Button>
	</div>
</section>

<p class="mt-6 text-center text-[13px] text-muted-foreground">
	心愿完成 {doneWishes} / {wishes.docs.length} · <a href="/wish" class="text-sea">去看看 <ArrowRight class="inline size-3" /></a>
</p>
