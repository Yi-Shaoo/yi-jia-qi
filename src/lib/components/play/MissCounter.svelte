<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { heartBurst } from "$lib/fx";
	import { fmtTime, keyOf, todayKey } from "$lib/dates";
	import { WHO, otherOf, type Who } from "$lib/types";
	import { cn } from "$lib/utils";

	/** 想你计数器：可以连着狂点，停 1.1 秒记一次连击 */
	const miss = useCollection("miss");
	const me = $derived(session.who as Who);
	const today = todayKey();
	const nOf = (n: number) => (n > 0 ? Math.min(Math.floor(n), 99) : 1);

	const counts = $derived.by(() => {
		const c = { yi: 0, jq: 0 };
		const best = { yi: 0, jq: 0 };
		for (const m of miss.docs) {
			if (keyOf(new Date(m.data.c)) !== today) continue;
			const w = m.data.who === "jq" ? "jq" : "yi";
			c[w] += nOf(m.data.n);
			best[w] = Math.max(best[w], nOf(m.data.n));
		}
		return { c, best };
	});
	const rows = $derived(miss.docs.slice().sort((a, b) => b.data.c - a.data.c).slice(0, 8));

	let combo = $state(0);
	let beat = $state(false);
	let note = $state("");
	let timer = 0;
	let btn: HTMLButtonElement;

	async function flush(text = "") {
		clearTimeout(timer);
		let n = combo;
		combo = 0;
		if (!n && !text) return;
		if (!n) n = 1;
		try {
			await miss.add({ who: me, n: Math.min(n, 99), note: text.slice(0, 40), c: Date.now() });
			toast(n > 1 ? `一口气想了 ${WHO[otherOf(me)]} ${n} 次，已经告诉 TA 了` : `已经告诉 ${WHO[otherOf(me)]} 你想 TA 了`);
		} catch {
			toast.error("没存上，再试一次");
		}
	}
	function tap() {
		beat = false;
		requestAnimationFrame(() => (beat = true));
		combo = Math.min(combo + 1, 99);
		heartBurst(btn, Math.min(3 + combo, 14), 40 + combo * 4);
		clearTimeout(timer);
		timer = window.setTimeout(() => flush(), 1100);
	}
	function send(e: SubmitEvent) {
		e.preventDefault();
		if (!combo) heartBurst(btn);
		flush(note.trim());
		note = "";
	}
	onMount(() => {
		const onHide = () => {
			if (document.hidden && combo) flush();
		};
		document.addEventListener("visibilitychange", onHide);
		return () => {
			document.removeEventListener("visibilitychange", onHide);
			if (combo) flush();
		};
	});
</script>

<PlayCard title="想你计数器" meta={`今天一共 ${counts.c.yi + counts.c.jq} 次`}>
	<div class="grid grid-cols-2 gap-2 text-sm">
		{#each ["yi", "jq"] as const as w (w)}
			<div class={cn("rounded-xl px-3 py-2", w === "yi" ? "bg-yi-soft" : "bg-jq-soft")}>
				今天 {WHO[w]} 想了 {WHO[otherOf(w)]}
				<b class="font-display text-xl">{counts.c[w]}</b> 次
				{#if counts.best[w] > 1}<small class="block text-xs text-muted-foreground">最高 x{counts.best[w]} 连击</small>{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-col items-center gap-2 py-2">
		<button
			bind:this={btn}
			type="button"
			onclick={tap}
			aria-label="想你了，可以连着点"
			class={cn("flex size-28 items-center justify-center rounded-full bg-coral text-5xl text-white shadow-[0_10px_30px_-8px_var(--coral)] transition-transform active:scale-95", beat && "animate-beat")}
		>
			♥
		</button>
		<div aria-live="polite" class={cn("h-7 font-display text-lg font-extrabold", combo >= 10 ? "text-coral" : combo >= 5 ? "text-sun" : "text-sea")}>
			{combo ? `x${combo} ${combo >= 10 ? "超级连击！" : "连击！"}` : ""}
		</div>
		<p class="text-xs text-muted-foreground">可以连着狂点，停下来 1 秒就会记一次连击</p>
	</div>
	<form onsubmit={send} class="flex gap-2">
		<Input bind:value={note} maxlength={40} placeholder="想说的一句话（可以不写）" aria-label="附一句话" />
		<Button type="submit" class="rounded-full">想你了</Button>
	</form>
	<div class="flex flex-col gap-2">
		<div class="text-sm font-semibold">想你记录</div>
		{#if !rows.length}<p class="text-sm text-muted-foreground">还没有记录，点一下大爱心试试。</p>{/if}
		{#each rows as m (m.id)}
			{@const n = nOf(m.data.n)}
			<div class="flex flex-col gap-1 border-b pb-2 text-sm last:border-b-0">
				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 font-mono text-xs text-muted-foreground">{fmtTime(m.data.c, keyOf(new Date(m.data.c)) !== today)}</span>
					<span class={cn("font-semibold", m.data.who === "yi" ? "text-yi" : "text-jq")}>{WHO[m.data.who]}</span>
					<span>{n > 1 ? `一口气想了你 ${n} 次${n >= 10 ? " 🔥🔥" : n >= 5 ? " 🔥" : ""}` : "想了你一下"}</span>
				</div>
				{#if m.data.note}<div class={cn("ml-22 rounded-xl px-3 py-1.5", m.data.who === "yi" ? "bg-yi-soft" : "bg-jq-soft")}>{m.data.note}</div>{/if}
			</div>
		{/each}
	</div>
</PlayCard>
