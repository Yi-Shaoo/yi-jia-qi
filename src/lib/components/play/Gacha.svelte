<script lang="ts">
	import { onDestroy } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { me } from "$lib/session.svelte";
	import { accountKey, readLocal, writeLocal } from "$lib/local";
	import { pick, reducedMotion } from "$lib/fx";
	import { keyOf, todayKey } from "$lib/dates";
	import { CAPSULE_COLORS, GACHA_TASKS } from "$lib/data/content";
	import { cn } from "$lib/utils";

	let { id }: { id: string } = $props();

	/** 扭蛋机：转一下掉出一个今天的小任务，完成打卡集一枚扭蛋章 */
	const stamps = useCollection("stamps");
	interface Cur {
		t: string;
		c: string;
		open: boolean;
	}
	const owner = me();
	const key = accountKey("gacha", owner);
	let cur = $state<Cur | null>(readLocal<Cur>(key));
	let knob = $state(0);
	let shaking = $state(false);
	let timer = 0;
	onDestroy(() => clearTimeout(timer));
	let busy = $state(false);

	function persist() {
		writeLocal(key, cur);
	}
	function turn() {
		if (shaking || busy || (cur && !cur.open)) return;
		knob += 360;
		shaking = true;
		const pool = GACHA_TASKS.filter((t) => t !== cur?.t);
		const next = { t: pick(pool), c: pick(CAPSULE_COLORS), open: false };
		timer = window.setTimeout(
			() => {
				cur = next;
				persist();
				shaking = false;
			},
			reducedMotion() ? 0 : 900,
		);
	}
	function openCapsule() {
		if (!cur || cur.open || shaking) return;
		cur = { ...cur, open: true };
		persist();
	}
	async function done() {
		if (!cur?.open || busy || shaking) return;
		busy = true;
		try {
			await stamps.add({ t: cur.t, c: Date.now(), who: owner, col: cur.c });
			toast.success("打卡成功，集到一枚扭蛋章");
			cur = null;
			persist();
		} catch {
			toast.error("没存上，再试一次");
		} finally {
			busy = false;
		}
	}

	const list = $derived(stamps.docs.filter((s) => s.data.t).sort((a, b) => (b.data.c ?? 0) - (a.data.c ?? 0)));
	const todayN = $derived(list.filter((s) => keyOf(new Date(s.data.c)) === todayKey()).length);
	const BALLS = [[18, 88], [52, 96], [86, 90], [112, 70], [34, 58], [70, 62], [100, 38], [20, 30], [56, 26], [84, 10], [8, 62], [44, 120]];
</script>

<PlayCard {id} title="扭蛋机" meta={`已集 ${list.length} 枚${todayN ? ` · 今天 ${todayN} 枚` : ""}`}>
	<div class="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-sea-soft/50 p-4 md:p-5">
		<div class="relative h-[220px] w-[170px] shrink-0" aria-hidden="true">
			<div class={cn("absolute top-0 left-[5px] h-[150px] w-[160px] overflow-hidden rounded-t-[80px] rounded-b-2xl border-2 border-foreground/15 bg-sea-soft/60", shaking && "animate-shake")}>
				{#each BALLS as [l, t], i (i)}
					<span
						class="absolute size-7 rounded-full border border-black/10"
						style:left={`${l}px`}
						style:top={`${t}px`}
						style:background={`linear-gradient(180deg, ${CAPSULE_COLORS[i % 6]} 50%, #fff 50%)`}
						style:transform={`rotate(${((i * 37) % 90) - 45}deg)`}
					></span>
				{/each}
			</div>
			<div class="absolute bottom-0 left-0 flex h-[76px] w-[170px] items-center justify-between rounded-2xl bg-coral px-5">
				<div class="h-6 w-12 rounded-md bg-black/25"></div>
				<div class="size-11 rounded-full border-4 border-white/80 bg-white/30 transition-transform duration-700" style:transform={`rotate(${knob}deg)`}>
					<div class="mx-auto mt-1 h-7 w-2 rounded-full bg-white"></div>
				</div>
			</div>
		</div>

		<div class="flex min-h-11 w-full max-w-sm flex-col items-center justify-center gap-3">
			{#if shaking}
				<p role="status" class="text-sm text-muted-foreground">抽取中…</p>
			{:else if !cur}
				<Button class="rounded-full" onclick={turn}>抽个小任务</Button>
			{:else if !cur.open}
				<Button variant="surface" onclick={openCapsule} class="flex flex-col items-center gap-3 text-sm font-medium">
					<span class="size-20 motion-safe:animate-bounce rounded-full border-2 border-black/10 shadow-lg" style:background={`linear-gradient(180deg, ${cur.c} 50%, #fff 50%)`}></span>
					打开扭蛋
				</Button>
			{:else}
				<div class="w-full animate-pop rounded-2xl p-4" style:background={`color-mix(in srgb, ${cur.c} 35%, var(--card))`}>
					<div class="text-xs font-semibold text-muted-foreground">今天的小任务</div>
					<div class="mt-1 font-display text-lg font-bold">{cur.t}</div>
					<div class="mt-3 flex flex-wrap gap-2">
						<Button size="sm" class="rounded-full" onclick={done} disabled={busy}>{busy ? "打卡中…" : "完成打卡"}</Button>
						<Button variant="outline" size="sm" class="rounded-full" onclick={turn} disabled={busy}>换一个</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if list.length}
		<div>
			<div class="mb-2 text-sm font-semibold">扭蛋章</div>
			<div class="flex flex-wrap gap-1.5">
				{#each list.slice(0, 24) as s (s.id)}
					<span title={s.data.t} class={cn("inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-xs", s.data.who === "jq" ? "bg-jq-soft" : "bg-yi-soft")}>
						<i class="size-4 shrink-0 rounded-full" style:background={CAPSULE_COLORS.includes(s.data.col) ? s.data.col : CAPSULE_COLORS[0]}></i>
						<span class="truncate">{s.data.t}</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}
</PlayCard>
