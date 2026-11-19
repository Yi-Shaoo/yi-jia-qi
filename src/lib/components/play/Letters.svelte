<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { readLocal, writeLocal } from "$lib/local";
	import { addDays, dayDiff, fmtTime, isDateKey, todayKey } from "$lib/dates";
	import { WHO, otherOf, type Doc, type Letter, type Who } from "$lib/types";
	import { cn } from "$lib/utils";
	import Mail from "@lucide/svelte/icons/mail";
	import MailOpen from "@lucide/svelte/icons/mail-open";

	/** 时光信箱：写给对方的信，到了设定那天才能拆开 */
	const letters = useCollection("letters");
	const me = $derived(session.who as Who);
	const today = todayKey();
	const all = $derived(
		letters.docs
			.filter((l) => l.data.t)
			.map((l) => ({ ...l, data: { ...l.data, open: isDateKey(l.data.open) ? l.data.open : "2999-01-01" } }))
			.sort((a, b) => (a.data.open < b.data.open ? -1 : 1)),
	);
	const toMe = $derived(all.filter((l) => l.data.from !== me));
	const fromMe = $derived(all.filter((l) => l.data.from === me));

	let openId = $state<string | null>(null);
	const opened = $derived(all.find((l) => l.id === openId && (l.data.from === me || l.data.open <= today)));

	const draft = readLocal<{ title: string; t: string }>("ltdraft");
	let title = $state(draft?.title ?? "");
	let text = $state(draft?.t ?? "");
	let date = $state(addDays(7));

	function view(l: Doc<Letter>, mine: boolean) {
		const ready = l.data.open <= today;
		if (!mine && !ready) return toast(`还没到日子，${dayDiff(l.data.open)} 天后才能拆`);
		openId = l.id;
		if (!mine && !l.data.read) letters.update(l.id, { read: true }).catch(() => {});
	}
	async function send(e: SubmitEvent) {
		e.preventDefault();
		const v = text.trim();
		if (!v) return;
		if (!isDateKey(date) || date <= today) return toast("拆信日期要选明天或以后");
		try {
			await letters.add({ from: me, title: title.trim().slice(0, 30), t: v.slice(0, 1500), open: date, c: Date.now(), read: false });
			title = "";
			text = "";
			writeLocal("ltdraft", null);
			toast.success(`信已寄出，${date.replaceAll("-", ".")} 才能拆开`);
		} catch {
			toast.error("没寄出去，再试一次");
		}
	}
	async function recall(id: string) {
		await letters.remove(id).then(
			() => {
				openId = null;
				toast("已撤回");
			},
			() => toast.error("没撤回成功"),
		);
	}
</script>

{#snippet row(l: Doc<Letter>, mine: boolean)}
	{@const ready = l.data.open <= today}
	{@const days = dayDiff(l.data.open)}
	<button
		type="button"
		onclick={() => view(l, mine)}
		class={cn(
			"flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-muted/60",
			!mine && ready && !l.data.read && "border-coral bg-coral-soft/50",
		)}
	>
		<span class={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", l.data.from === "yi" ? "bg-yi-soft text-yi" : "bg-jq-soft text-jq")}>
			{#if ready}<MailOpen class="size-5" />{:else}<Mail class="size-5" />{/if}
		</span>
		<span class="flex min-w-0 flex-1 flex-col">
			<b class="truncate font-semibold">{l.data.title || "一封信"}</b>
			<small class="text-xs text-muted-foreground">
				{#if mine}寄给 {WHO[otherOf(l.data.from)]} · {ready ? (l.data.read ? "TA 已经拆开了" : "已经可以拆了") : `${l.data.open.replaceAll("-", ".")} 送达`}
				{:else}{ready ? (l.data.read ? "已拆开 · 点开再看一遍" : "可以拆开了！") : `来自 ${WHO[l.data.from]} · 还有 ${days} 天`}{/if}
			</small>
		</span>
		<span class="shrink-0 font-mono text-xs text-muted-foreground">{ready ? "✉" : `${l.data.open.slice(5).replace("-", ".")} ${mine ? "送达" : "可拆"}`}</span>
	</button>
{/snippet}

<PlayCard title="时光信箱" meta={toMe.length ? `收到 ${toMe.length} 封` : ""}>
	{#if opened}
		<div class="animate-pop rounded-2xl bg-[#fffdf5] p-5 text-[#3b2f2a] shadow-[0_0_0_1px_var(--border)]">
			<h3 class="font-display text-lg font-bold">{opened.data.title || "一封信"}</h3>
			<p class="mt-2 text-[15px] leading-7 whitespace-pre-line">{opened.data.t}</p>
			<small class="mt-3 block text-xs opacity-70">
				{opened.data.from === me ? `你写给 ${WHO[otherOf(me)]}` : `来自 ${WHO[opened.data.from]}`} · 写于 {fmtTime(opened.data.c)} · {opened.data.open.replaceAll("-", ".")} 拆开
			</small>
			<div class="mt-3 flex gap-2">
				<Button variant="outline" size="sm" class="rounded-full" onclick={() => (openId = null)}>收起</Button>
				{#if opened.data.from === me}{@const id = opened.id}<ConfirmButton variant="outline" class="rounded-full" confirmLabel="确定撤回？" onconfirm={() => recall(id)}>撤回这封信</ConfirmButton>{/if}
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		{#if !toMe.length && !fromMe.length}<p class="text-sm text-muted-foreground">信箱是空的。写一封给未来的 TA 吧。</p>{/if}
		{#each toMe as l (l.id)}{@render row(l, false)}{/each}
		{#if fromMe.length}
			<div class="mt-2 text-xs font-semibold text-muted-foreground">你寄出的信</div>
			{#each fromMe as l (l.id)}{@render row(l, true)}{/each}
		{/if}
	</div>

	<form onsubmit={send} oninput={() => writeLocal("ltdraft", { title, t: text })} class="flex flex-col gap-2 border-t pt-4">
		<Input bind:value={title} maxlength={30} placeholder="信的标题，比如：给一个月后的你" aria-label="信的标题" />
		<Textarea bind:value={text} maxlength={1500} rows={4} placeholder="写给对方的信，到了你设定的那天才能拆开" />
		<div class="flex flex-wrap items-end gap-3">
			<div class="flex flex-col gap-1.5">
				<Label for="lt-date">哪天能拆</Label>
				<Input id="lt-date" type="date" min={addDays(1)} bind:value={date} class="w-44" />
			</div>
			<Button type="submit" class="rounded-full" disabled={!text.trim()}>寄出</Button>
		</div>
	</form>
</PlayCard>
