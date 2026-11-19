<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { readLocal, writeLocal } from "$lib/local";
	import { questionFor } from "$lib/daily";
	import { fmtDots, isDateKey, todayKey } from "$lib/dates";
	import { WHO, otherOf, type Daily, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import Lock from "@lucide/svelte/icons/lock";

	/** 每日一问：自己答完才能看到对方的回答 */
	const daily = useCollection("daily");
	const me = $derived(session.who as Who);
	const other = $derived(otherOf(me));
	const today = todayKey();
	const doc = $derived<Daily>(daily.get(today)?.data ?? { q: "" });
	const question = $derived(doc.q || questionFor(today));
	const mine = $derived(doc[me]?.t);
	const theirs = $derived(doc[other]?.t);

	const dk = $derived(`dqdraft:${today}:${me}`);
	let answer = $state(readLocal<string>(`dqdraft:${todayKey()}:${session.who}`) ?? "");
	let busy = $state(false);
	let revealed = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const v = answer.trim();
		if (!v) return;
		busy = true;
		try {
			await daily.set(today, { ...doc, q: question, [me]: { t: v.slice(0, 500), at: Date.now() } });
			writeLocal(dk, null);
			revealed = true;
			toast.success("交卷啦");
		} catch {
			toast.error("没存上，再试一次");
		} finally {
			busy = false;
		}
	}

	const past = $derived(
		daily.docs
			.filter((d) => isDateKey(d.id) && d.id < today)
			.sort((a, b) => (a.id < b.id ? 1 : -1)),
	);
</script>

{#snippet box(who: Who, d: Daily, locked: boolean, reveal = false)}
	<div class={cn("flex-1 rounded-2xl border border-dashed p-3", who === "yi" ? "border-yi/40 bg-yi-soft/40" : "border-jq/40 bg-jq-soft/40", reveal && "animate-pop")}>
		<b class={cn("text-xs", who === "yi" ? "text-yi" : "text-jq")}>{WHO[who]}</b>
		{#if d[who]?.t}
			{#if locked}
				<p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Lock class="size-3.5" />藏起来的回答，先答完自己的才能看</p>
			{:else}
				<p class="mt-1 text-[15px] whitespace-pre-line">{d[who]?.t}</p>
			{/if}
		{:else}
			<p class="mt-1 text-sm text-muted-foreground">还没回答</p>
		{/if}
	</div>
{/snippet}

<PlayCard id="daily" title="每日一问" meta={fmtDots(today)}>
	<p class="font-display text-[22px] leading-snug font-bold text-sea md:text-2xl">{question}</p>
	{#if !mine}
		<form onsubmit={submit} class="flex flex-col gap-2">
			<Textarea bind:value={answer} oninput={() => writeLocal(dk, answer)} maxlength={500} rows={3} placeholder={`写下你的回答，答完才能看到 ${WHO[other]} 的`} />
			<div class="flex flex-wrap items-center gap-3">
				<Button type="submit" class="rounded-full" disabled={busy || !answer.trim()}>提交我的回答</Button>
				<small class="text-[13px] text-muted-foreground">{theirs ? `${WHO[other]} 已经回答了，交卷就能看到 ♡` : `${WHO[other]} 还没回答`}</small>
			</div>
		</form>
		<div class="flex">{@render box(other, doc, true)}</div>
	{:else}
		<div class="flex flex-col gap-2 sm:flex-row">
			{@render box("yi", doc, false, revealed && !!theirs)}
			{@render box("jq", doc, false, revealed && !!theirs)}
		</div>
	{/if}

	<details class="group">
		<summary class="cursor-pointer text-sm font-medium text-muted-foreground select-none">以前的问答（{past.length}）</summary>
		<div class="mt-3 flex flex-col gap-4">
			{#if !past.length}<p class="text-sm text-muted-foreground">还没有以前的问答。</p>{/if}
			{#each past as p (p.id)}
				{@const both = !!(p.data.yi?.t && p.data.jq?.t)}
				<div class="flex flex-col gap-2 border-t pt-3">
					<span class="font-mono text-xs text-muted-foreground">{fmtDots(p.id)}</span>
					<span class="font-semibold">{p.data.q || questionFor(p.id)}</span>
					<div class="flex flex-col gap-2 sm:flex-row">
						{@render box("yi", p.data, !both && me !== "yi")}
						{@render box("jq", p.data, !both && me !== "jq")}
					</div>
				</div>
			{/each}
		</div>
	</details>
</PlayCard>
