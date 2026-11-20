<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Card } from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { me as account } from "$lib/session.svelte";
	import { accountKey, readLocal, writeLocal } from "$lib/local";
	import { fmtTime } from "$lib/dates";
	import { WHO, otherOf } from "$lib/types";
	import { cn } from "$lib/utils";

	let { id }: { id: string } = $props();

	/** 漂流瓶：写一句话扔给对方，对方捡起来才能看 */
	const bottles = useCollection("bottles");
	const me = account();
	const key = accountKey("btdraft", me);
	const list = $derived(bottles.docs.filter((b) => b.data.t));
	const waiting = $derived(list.filter((b) => b.data.from !== me && !b.data.picked).sort((a, b) => a.data.c - b.data.c));
	const sent = $derived(list.filter((b) => b.data.from === me && !b.data.picked).length);
	const picked = $derived(
		list.filter((b) => b.data.picked).sort((a, b) => (b.data.pickedAt || b.data.c) - (a.data.pickedAt || a.data.c)),
	);

	let openId = $state<string | null>(null);
	const opened = $derived(openId ? list.find((b) => b.id === openId) : undefined);
	let text = $state(readLocal<string>(key) ?? "");
	let throwing = $state(false);
	let picking = $state(false);

	async function pickUp() {
		const b = waiting[0];
		if (!b || picking || throwing) return;
		picking = true;
		try {
			await bottles.update(b.id, { picked: true, pickedAt: Date.now() });
			openId = b.id;
		} catch {
			toast.error("没捡起来，再试一次");
		} finally {
			picking = false;
		}
	}
	async function send(e: SubmitEvent) {
		e.preventDefault();
		const original = text;
		const v = original.trim();
		if (!v || throwing || picking) return;
		openId = null;
		throwing = true;
		try {
			await bottles.add({ from: me, t: v.slice(0, 300), c: Date.now(), picked: false });
			if (text === original) {
				text = "";
				writeLocal(key, null);
			}
			toast(`瓶子扔出去了，等 ${WHO[otherOf(me)]} 来捡`);
			setTimeout(() => (throwing = false), 1200);
		} catch {
			throwing = false;
			toast.error("没扔出去，再试一次");
		}
	}
</script>

{#snippet bottle(cls = "")}
	<svg viewBox="0 0 64 64" aria-hidden="true" class={cn("size-14", cls)}>
		<rect x="27" y="6" width="10" height="8" rx="2" fill="#c9a37a" />
		<path d="M25 14h14v8c6 3 9 8 9 15v15c0 4-3 7-7 7H23c-4 0-7-3-7-7V37c0-7 3-12 9-15z" fill="#ffffff" fill-opacity=".8" stroke="#7cc0ec" stroke-width="2" />
		<rect x="22" y="34" width="20" height="14" rx="3" fill="#fff3c4" stroke="#e9c33f" />
		<path d="M26 38h12M26 42h8" stroke="#c9a33f" stroke-width="1.5" />
	</svg>
{/snippet}

<PlayCard {id} title="漂流瓶" meta={list.length ? `一共 ${list.length} 个` : ""}>
	<div class="relative flex min-h-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#bfe6f5,#8fcbe6)] p-4 text-[#173f5a] dark:bg-[linear-gradient(180deg,#123049,#0e2436)] dark:text-[#cfe6f3]">
		{#if throwing}
			{@render bottle("animate-[float-up_1.2s_ease-out_forwards] [--dy:-80px] [--dx:120px]")}
		{:else if picking}
			<p role="status" class="text-sm">捡起中…</p>
		{:else if opened}
			<Card variant="surface" class="w-full animate-pop p-4">
				<p class="text-[15px] wrap-anywhere whitespace-pre-line">{opened.data.t}</p>
				<div class="mt-2 flex flex-wrap items-center justify-between gap-2">
					<small class="text-xs opacity-70">来自 {WHO[opened.data.from]} · {fmtTime(opened.data.c)}</small>
					<Button size="sm" variant="outline" onclick={() => (openId = null)}>收起</Button>
				</div>
			</Card>
		{:else if waiting.length}
			<Button variant="surface" onclick={pickUp} class="flex flex-col items-center gap-1 text-sm font-medium">
				{@render bottle("animate-bounce")}
				捡一个瓶子（{waiting.length} 个待捡）
			</Button>
		{:else if !sent}
			<p class="text-center text-sm">海面很安静。</p>
		{/if}
		{#if sent}<p class="text-center text-sm">你扔出的 {sent} 个瓶子，等 {WHO[otherOf(me)]} 来捡。</p>{/if}
	</div>
	<form onsubmit={send} class="flex flex-col gap-2">
		<Label for="bottle-text">瓶中留言</Label>
		<Textarea id="bottle-text" bind:value={text} oninput={(e) => writeLocal(key, e.currentTarget.value)} maxlength={300} rows={2} />
		<Button type="submit" class="self-start rounded-full" disabled={throwing || picking || !text.trim()}>扔出去</Button>
	</form>
	<details>
		<summary class="min-h-11 cursor-pointer content-center text-sm font-medium text-muted-foreground select-none">捡到过的瓶子（{picked.length}）</summary>
		<div class="mt-3 flex flex-col gap-2">
			{#if !picked.length}<p class="text-sm text-muted-foreground">还没有被捡到的瓶子。</p>{/if}
			{#each picked as b (b.id)}
				<div class="flex gap-2 border-b pb-2 text-sm last:border-b-0">
					<span class={cn("shrink-0 font-semibold", b.data.from === "yi" ? "text-yi" : "text-jq")}>来自 {WHO[b.data.from]}</span>
					<span class="min-w-0 flex-1 wrap-anywhere whitespace-pre-line">{b.data.t}</span>
					<span class="shrink-0 font-mono text-xs text-muted-foreground">{fmtTime(b.data.c)}</span>
				</div>
			{/each}
		</div>
	</details>
</PlayCard>
