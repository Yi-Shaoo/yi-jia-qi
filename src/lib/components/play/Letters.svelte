<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Card } from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { DatePicker } from "$lib/components/ui/date-picker";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import ConfirmButton from "$lib/components/ConfirmButton.svelte";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { me as account } from "$lib/session.svelte";
	import { accountKey, readLocal, writeLocal } from "$lib/local";
	import { addDays, dayDiff, fmtShort, fmtTime, isDateKey, todayKey } from "$lib/dates";
	import { WHO, otherOf, type Doc, type Letter } from "$lib/types";
	import { cn } from "$lib/utils";
	import Mail from "@lucide/svelte/icons/mail";
	import MailOpen from "@lucide/svelte/icons/mail-open";

	let { id }: { id: string } = $props();
	const letters = useCollection("letters");
	const me = account();
	const key = accountKey("ltdraft", me);
	const partner = $derived(WHO[otherOf(me)]);
	const today = todayKey();
	const all = $derived(
		letters.docs
			.filter((l) => l.data.t)
			.map((l) => ({ ...l, data: { ...l.data, open: isDateKey(l.data.open) ? l.data.open : "2999-01-01" } }))
			.sort((a, b) => a.data.open.localeCompare(b.data.open)),
	);
	const toMe = $derived(all.filter((l) => l.data.from !== me));
	const fromMe = $derived(all.filter((l) => l.data.from === me));

	let openId = $state<string | null>(null);
	const draft = readLocal<{ title: string; t: string; date?: string }>(key);
	let title = $state(draft?.title ?? "");
	let text = $state(draft?.t ?? "");
	let date = $state(draft?.date ?? addDays(7));
	let sending = $state(false);

	function displayDate(key: string) {
		return key.slice(0, 4) === today.slice(0, 4) ? fmtShort(key) : key.replaceAll("-", ".");
	}
	async function view(l: Doc<Letter>) {
		const mine = l.data.from === me;
		if (!mine && l.data.open > today) return;
		openId = openId === l.id ? null : l.id;
		if (openId && !mine && !l.data.read) {
			try {
				await letters.update(l.id, { read: true });
			} catch {
				toast.error("已拆状态没存上，收起后再打开试试");
			}
		}
	}
	function persistDraft() {
		writeLocal(key, { title, t: text, date });
	}

	async function send(e: SubmitEvent) {
		e.preventDefault();
		const v = text.trim();
		if (!v || sending) return;
		if (!isDateKey(date) || date <= todayKey()) return toast("可拆日期要选明天或以后");
		sending = true;
		try {
			await letters.add({ from: me, title: title.trim().slice(0, 30), t: v.slice(0, 1500), open: date, c: Date.now(), read: false });
			title = "";
			text = "";
			writeLocal(key, null);
			toast.success(`信已寄出，${displayDate(date)} 可拆`);
		} catch {
			toast.error("没寄出去，再试一次");
		} finally {
			sending = false;
		}
	}
	async function recall(id: string) {
		try {
			await letters.remove(id);
			if (openId === id) openId = null;
			toast("已撤回");
		} catch {
			toast.error("没撤回成功，再试一次");
		}
	}
</script>

{#snippet group(list: Doc<Letter>[], mine: boolean)}
	{#if list.length}
		{@const groupId = mine ? "lt-sent" : "lt-received"}
		<section aria-labelledby={groupId} class="flex flex-col gap-2">
			<div class="flex flex-wrap items-baseline gap-x-2">
				<h3 id={groupId} class="text-sm font-semibold">{mine ? "寄出" : "收到"}（{list.length}）</h3>
				<span class="text-xs text-muted-foreground">{mine ? "寄给" : "来自"} {partner}</span>
			</div>
			<ul class="grid gap-2">
				{#each list as l (l.id)}
					{@const ready = l.data.open <= today}
					{@const canView = mine || ready}
					{@const expanded = openId === l.id && canView}
					<li class={cn("min-w-0 rounded-2xl border", !mine && ready && !l.data.read && "border-coral bg-coral-soft/50")}>
						<Button variant="surface" onclick={() => view(l)} disabled={!canView} aria-expanded={canView ? expanded : undefined} aria-controls={expanded ? `lt-letter-${l.id}` : undefined}
							class="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors enabled:hover:bg-muted/60">
							<span class={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", l.data.from === "yi" ? "bg-yi-soft text-yi" : "bg-jq-soft text-jq")}>
								{#if l.data.read}<MailOpen aria-hidden="true" class="size-5" />{:else}<Mail aria-hidden="true" class="size-5" />{/if}
							</span>
							<span class="flex min-w-0 flex-1 flex-col">
								<b class="font-semibold wrap-anywhere">{l.data.title || "一封信"}</b>
								<small class="text-xs text-muted-foreground">{displayDate(l.data.open)} 可拆{l.data.read ? " · 已拆" : ready ? " · 未拆" : !mine ? ` · 还有 ${dayDiff(l.data.open)} 天` : ""}</small>
							</span>
							{#if expanded}<span class="shrink-0 text-sm">收起</span>{/if}
						</Button>
						{#if expanded}
							<Card variant="surface" id={`lt-letter-${l.id}`} class="mx-3 mb-3 animate-pop p-4">
								<p class="text-[15px] leading-7 wrap-anywhere whitespace-pre-line">{l.data.t}</p>
								<small class="mt-3 block text-xs opacity-70">{fmtTime(l.data.c)} 寄出</small>
								{#if mine}
									<ConfirmButton variant="outline" class="mt-3 rounded-full" confirmLabel="确认撤回" description={`${l.data.read ? `${partner} 已拆过这封信。` : ""}撤回会从两人的信箱删除这封信，无法恢复。`} onconfirm={() => recall(l.id)}>撤回这封信</ConfirmButton>
								{/if}
							</Card>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/snippet}

<PlayCard {id} title="时光信箱">
	{#if !all.length}<p class="text-sm text-muted-foreground">信箱是空的。</p>{/if}
	{@render group(toMe, false)}
	{@render group(fromMe, true)}

	<form onsubmit={send} oninput={persistDraft} class="flex flex-col gap-3 border-t pt-4">
		<h3 class="text-sm font-semibold">写给 {partner}</h3>
		<div class="grid gap-1.5">
			<Label for="lt-title">标题（可选）</Label>
			<Input id="lt-title" bind:value={title} maxlength={30} disabled={sending} />
		</div>
		<div class="grid gap-1.5">
			<Label for="lt-text">信件正文</Label>
			<Textarea id="lt-text" bind:value={text} maxlength={1500} rows={4} required disabled={sending} />
		</div>
		<div class="flex flex-wrap items-end gap-3">
			<div class="grid gap-1.5">
				<div class="flex items-baseline gap-2"><Label for="lt-date">可拆日期</Label><small id="lt-min" class="text-xs text-muted-foreground">明天起可选</small></div>
				<DatePicker id="lt-date" aria-describedby="lt-min" min={addDays(1)} bind:value={date} class="w-44" disabled={sending} onValueChange={persistDraft} />
			</div>
			<Button type="submit" class="rounded-full" disabled={sending || !text.trim()}>{sending ? "寄出中…" : "寄出"}</Button>
		</div>
	</form>
</PlayCard>
