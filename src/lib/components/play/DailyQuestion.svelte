<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { me as account } from "$lib/session.svelte";
	import { accountKey, readLocal, writeLocal } from "$lib/local";
	import { questionFor } from "$lib/daily";
	import { fmtDots, isDateKey, todayKey } from "$lib/dates";
	import { WHO, otherOf, type Daily, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import Lock from "@lucide/svelte/icons/lock";

	let { id }: { id: string } = $props();

	/** 每日一问：自己答完才能看到对方的回答 */
	const daily = useCollection("daily");
	const me = account();
	const other = $derived(otherOf(me));
	const today = todayKey();
	const entry = $derived(daily.get(today));
	const doc = $derived<Daily>(entry?.data ?? { q: "" });
	const question = $derived(doc.q || questionFor(today));
	const mine = $derived(doc[me]?.t);
	const theirs = $derived(doc[other]?.t);

	const dk = accountKey(`dqdraft:${today}`, me);
	let answer = $state(readLocal<string>(dk) ?? "");
	let busy = $state(false);
	let revealed = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const v = answer.trim();
		if (!daily.ready || !v || busy || mine) return;
		if (today !== todayKey()) return toast("今天换题了，刷新后回答新题");
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

{#snippet box(who: Who, d: Daily, history = false)}
	<div class={cn("min-w-0 flex-1 rounded-2xl border border-dashed p-3", who === "yi" ? "border-yi/40 bg-yi-soft/40" : "border-jq/40 bg-jq-soft/40", !history && revealed && !!theirs && "animate-pop")}>
		<b class={cn("text-xs", who === "yi" ? "text-yi" : "text-jq")}>{WHO[who]}</b>
		{#if d[who]?.t}
			{#if history && who !== me && !d[me]?.t}
				<p class="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground"><Lock aria-hidden="true" class="mt-0.5 size-3.5 shrink-0" />对方答案未解锁，历史问答不能补答。</p>
			{:else}
				<p class="mt-1 text-[15px] wrap-anywhere whitespace-pre-line">{d[who]?.t}</p>
			{/if}
		{:else}
			<p class="mt-1 text-sm text-muted-foreground">{history ? "当天未作答" : "还没回答"}</p>
		{/if}
	</div>
{/snippet}

<PlayCard {id} class="lg:col-span-2" title="每日一问" meta={fmtDots(today)}>
	<CollectionNotice status={daily.status} retry={() => daily.load()} label="每日一问" />
	{#if daily.ready || entry}
		<p class="font-display text-[22px] leading-snug font-bold wrap-anywhere text-sea md:text-2xl">{question}</p>
		{#if !mine || busy}
			<form onsubmit={submit} class="flex flex-col gap-2">
				<Label for="daily-answer">我的回答</Label>
				<Textarea id="daily-answer" aria-describedby="daily-rule" bind:value={answer} oninput={(e) => writeLocal(dk, e.currentTarget.value)} maxlength={500} rows={3} disabled={busy} />
				<div class="flex flex-wrap items-center gap-3">
					<Button type="submit" class="rounded-full" disabled={!daily.ready || busy || !answer.trim()}>提交我的回答</Button>
					<small id="daily-rule" class="text-[13px] text-muted-foreground">{WHO[other]} {theirs ? "已答，提交后可见" : "还没回答，两人都提交后可见"}</small>
				</div>
			</form>
		{:else}
			<div class="flex flex-col gap-2 sm:flex-row">
				{@render box("yi", doc)}
				{@render box("jq", doc)}
			</div>
		{/if}
	{/if}

	<details hidden={!daily.ready && !past.length}>
		<summary class="min-h-11 cursor-pointer content-center text-sm font-medium text-muted-foreground select-none">以前的问答（{past.length}）</summary>
		<div class="mt-3 flex flex-col gap-4">
			{#if !past.length}<p class="text-sm text-muted-foreground">还没有以前的问答。</p>{/if}
			{#each past as p (p.id)}
				<div class="flex flex-col gap-2 border-t pt-3">
					<span class="font-mono text-xs text-muted-foreground">{fmtDots(p.id)}</span>
					<span class="font-semibold">{p.data.q || questionFor(p.id)}</span>
					<div class="flex flex-col gap-2 sm:flex-row">
						{@render box("yi", p.data, true)}
						{@render box("jq", p.data, true)}
					</div>
				</div>
			{/each}
		</div>
	</details>
</PlayCard>
