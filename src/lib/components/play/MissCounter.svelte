<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Label } from "$lib/components/ui/label";
	import { sendMissNote, type MissNoteDraft } from "./miss-note";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { me as account, session } from "$lib/session.svelte";
	import { heartBurst } from "$lib/fx";
	import { fmtTime, keyOf, todayKey } from "$lib/dates";
	import { WHO, otherOf } from "$lib/types";
	import { cn } from "$lib/utils";

	import Heart from "@lucide/svelte/icons/heart";
	import Flame from "@lucide/svelte/icons/flame";

	let { id }: { id: string } = $props();

	/** 想你计数器：可以连着狂点，停 1.1 秒记一次连击 */
	const miss = useCollection("miss");
	const me = account();
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
	const rows = $derived(miss.docs.slice().sort((a, b) => b.data.c - a.data.c));

	let combo = $state(0);
	let beat = $state(false);
	const draft = $state<MissNoteDraft>({ text: "", edits: 0, sending: false });
	let noteInput = $state<HTMLInputElement | null>(null);
	let timer = 0;
	let btn = $state<HTMLButtonElement | null>(null);

	async function flush(text = "") {
		clearTimeout(timer);
		const taps = combo;
		if (!taps && !text) return;
		combo = 0;
		const n = taps || 1;
		try {
			await miss.add({ who: me, n, note: text, c: Date.now() });
			toast(n > 1 ? `一口气想了 ${WHO[otherOf(me)]} ${n} 次，已经告诉 TA 了` : `已经告诉 ${WHO[otherOf(me)]} 你想 TA 了`);
		} catch (error) {
			combo = Math.min(99, combo + taps);
			throw error;
		}
	}
	function settleTaps() {
		flush().catch(() => toast.error("连击没存上，再点一次重试"));
	}
	function tap() {
		beat = false;
		requestAnimationFrame(() => (beat = true));
		combo = Math.min(combo + 1, 99);
		heartBurst(btn, Math.min(3 + combo, 14), 40 + combo * 4);
		clearTimeout(timer);
		timer = window.setTimeout(settleTaps, 1100);
	}
	async function send(e: SubmitEvent) {
		e.preventDefault();
		try {
			await sendMissNote(draft, (text) => {
				noteInput?.focus({ preventScroll: true });
				if (!combo) heartBurst(btn);
				return flush(text);
			});
		} catch {
			toast.error("留言没发出，请再试一次");
		}
	}
	onMount(() => {
		const onHide = () => {
			if (document.hidden && combo) settleTaps();
		};
		document.addEventListener("visibilitychange", onHide);
		return () => {
			document.removeEventListener("visibilitychange", onHide);
			clearTimeout(timer);
			if (combo && session.who === me) settleTaps();
		};
	});
</script>

<PlayCard {id} title="想你计数器" meta={`今天一共 ${counts.c.yi + counts.c.jq} 次`}>
	<div class="grid grid-cols-2 gap-2 text-sm">
		{#each ["yi", "jq"] as const as w (w)}
			<div class={cn("rounded-xl px-3 py-2", w === "yi" ? "bg-yi-soft" : "bg-jq-soft")}>
				{WHO[w]} 想了 {WHO[otherOf(w)]}
				<b class="font-display text-xl">{counts.c[w]}</b> 次
				{#if counts.best[w] > 1}<small class="block text-xs text-muted-foreground">最高 x{counts.best[w]} 连击</small>{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-col items-center gap-2 py-2">
		<Button variant="surface"
			bind:ref={btn}
			type="button"
			onclick={tap}
			aria-label="想你了，可以连着点"
			class={cn("flex size-28 items-center justify-center rounded-full bg-coral text-5xl text-primary-foreground shadow-[0_10px_30px_-8px_var(--coral)] transition-transform active:scale-95", beat && "animate-beat")}
		>
			<Heart aria-hidden="true" class="size-12 fill-current" />
		</Button>
		<div aria-live="polite" class={cn("h-7 font-display text-lg font-extrabold", combo >= 10 ? "text-coral" : combo >= 5 ? "text-sun" : "text-sea")}>
			{combo ? `x${combo} ${combo >= 10 ? "超级连击！" : "连击！"}` : ""}
		</div>
		<p class="text-xs text-muted-foreground">连点爱心，停约 1 秒后结算。</p>
	</div>
	<form onsubmit={send} class="flex flex-col gap-2">
		<div class="flex items-baseline gap-2">
			<Label for="miss-note">附言</Label>
			<small id="miss-note-count" class="text-xs text-muted-foreground">单发留言也计 1 次</small>
		</div>
		<div class="flex items-center gap-2">
			<Input id="miss-note" aria-describedby="miss-note-count" bind:ref={noteInput} bind:value={draft.text} oninput={() => draft.edits++} maxlength={40} />
			<Button type="submit" class="rounded-full" disabled={draft.sending || !draft.text.trim()}>{draft.sending ? "发送中…" : "发送留言"}</Button>
		</div>
	</form>
	<div class="flex flex-col gap-2">
		<h3 id="miss-history-title" class="text-sm font-semibold">想你记录</h3>
		{#if rows.length}
			<ScrollArea type="auto" viewportProps={{ tabindex: 0, role: "region", "aria-labelledby": "miss-history-title", class: "h-auto max-h-56" }}>
				<ul class="divide-y pr-3">
					{#each rows as m (m.id)}
						{@const n = nOf(m.data.n)}
						<li class="grid grid-cols-[5rem_auto_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1 py-2 text-sm">
							<span class="font-mono text-xs text-muted-foreground">{fmtTime(m.data.c, keyOf(new Date(m.data.c)) !== today)}</span>
							<span class={cn("font-semibold", m.data.who === "yi" ? "text-yi" : "text-jq")}>{WHO[m.data.who]}</span>
							<span>{n > 1 ? `一口气想了你 ${n} 次` : "想了你一下"}{#if n >= 5}<Flame aria-hidden="true" class="ml-1 inline size-4 text-coral" />{/if}</span>
							{#if m.data.note}<span class={cn("col-span-2 col-start-2 rounded-xl px-3 py-1.5 wrap-anywhere", m.data.who === "yi" ? "bg-yi-soft" : "bg-jq-soft")}>{m.data.note}</span>{/if}
						</li>
					{/each}
				</ul>
			</ScrollArea>
		{:else}
			<p class="text-sm text-muted-foreground">还没有记录，点一下大爱心试试。</p>
		{/if}
	</div>
</PlayCard>
