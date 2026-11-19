<script lang="ts">
	import { onMount } from "svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import Postcard from "$lib/components/diary/Postcard.svelte";
	import Pudding from "$lib/components/diary/Pudding.svelte";
	import DiaryEditor from "$lib/components/diary/DiaryEditor.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { navigate, query } from "$lib/router.svelte";
	import { readLocal } from "$lib/local";
	import { fmtDots, isDateKey, todayKey } from "$lib/dates";
	import type { Who } from "$lib/types";
	import Plus from "@lucide/svelte/icons/plus";

	const diary = useCollection("diary");
	const me = $derived(session.who as Who);
	const list = $derived(
		diary.docs
			.filter((d) => isDateKey(d.data.date))
			.sort((a, b) => (a.data.date < b.data.date ? 1 : a.data.date > b.data.date ? -1 : (b.data.c ?? 0) - (a.data.c ?? 0))),
	);

	let open = $state(false);
	let date = $state(todayKey());
	let pudding: Pudding;
	function write(d = todayKey()) {
		date = d;
		open = true;
	}

	const draft = $derived.by(() => {
		if (open) return null;
		const d = readLocal<{ title?: string; date?: string; text?: string; fav?: string }>(`dydraft:new:${me}`);
		return d && ((d.text ?? "").trim() || (d.fav ?? "").trim() || (d.title ?? "").trim()) ? d : null;
	});

	onMount(() => {
		if (query("write") === "today") {
			navigate("/diary", { replace: true });
			write();
		}
	});
</script>

<div class="flex flex-wrap items-end justify-between gap-4">
	<PageHeader eyebrow="今日特供 · 我们的约会" title="约会日记" lede="同一天，两扇窗。各自的一天写一句话就好；见面的一天，一起写下这次约会。">
		{#snippet actions()}
			<Button class="rounded-full" onclick={() => write()}><Plus />写下今天</Button>
		{/snippet}
	</PageHeader>
	<div class="hidden pb-6 md:block"><Pudding bind:this={pudding} /></div>
</div>

{#if draft}
	<div class="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-sand px-4 py-3 text-sand-ink">
		<span class="text-sm">你有一篇没写完的草稿{draft.title ? `：“${draft.title}”` : ""}</span>
		<Button size="sm" class="rounded-full" onclick={() => write(draft.date || todayKey())}>继续写</Button>
	</div>
{/if}

{#if diary.status === "loading"}
	<p class="text-muted-foreground">正在加载…</p>
{:else if !list.length}
	<p class="rounded-2xl bg-card p-6 text-muted-foreground shadow-[0_0_0_1px_var(--border)]">还没有日记。点上面的按钮写下今天。</p>
{/if}

<div class="flex flex-col gap-6">
	{#each list as d (d.id)}
		<article class="rounded-[24px] bg-card p-5 shadow-[0_0_0_1px_var(--border)] md:p-6">
			<div class="flex flex-wrap items-center gap-2">
				<span class="font-mono text-xs text-muted-foreground">{fmtDots(d.data.date)}</span>
				<Badge variant={d.data.kind === "apart" ? "secondary" : "default"} class={d.data.kind === "together" ? "bg-coral text-white" : ""}>
					{d.data.kind === "apart" ? "各自的一天" : "见面的一天"}
				</Badge>
				<Button variant="ghost" size="xs" class="ml-auto rounded-full text-muted-foreground" onclick={() => write(d.data.date)}>编辑</Button>
			</div>
			<h2 class="mt-2 text-2xl font-bold">{d.data.title || (d.data.kind === "apart" ? "同一天，两扇窗" : "我们的约会")}</h2>
			{#if d.data.place && d.data.place !== d.data.yi?.pl && d.data.place !== d.data.jq?.pl}
				<span class="text-sm text-muted-foreground">📍 {d.data.place}</span>
			{/if}
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				{#each ["yi", "jq"] as const as w (w)}
					<Postcard who={w} side={d.data[w]} date={d.data.date} mine={w === me} onwrite={() => write(d.data.date)} />
				{/each}
			</div>
		</article>
	{/each}
</div>

<DiaryEditor bind:open {date} onsaved={() => pudding?.cheer()} />
