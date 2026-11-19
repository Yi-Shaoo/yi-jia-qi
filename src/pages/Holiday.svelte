<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import WishButton from "$lib/components/WishButton.svelte";
	import { THANKS, XMAS } from "$lib/data/content";
	import { dayDiff } from "$lib/dates";
</script>

<PageHeader eyebrow="Holiday 2026" title="感恩节和圣诞" lede="下面的活动日期来自主办方和旅游局 2026 年的公告，购票前再到官网确认一下。" />

<div class="grid gap-5 lg:grid-cols-2">
	{#each [THANKS, XMAS] as h (h.title)}
		{@const n = dayDiff(h.date)}
		<section class="flex flex-col gap-4 rounded-[24px] bg-card p-6 shadow-[0_0_0_1px_var(--border)] md:p-7">
			<span class="self-start rounded-full bg-coral-soft px-3 py-1 font-mono text-xs text-coral">
				{n > 0 ? `还有 ${n} 天` : n === 0 ? "就是今天" : "今年已过"}
			</span>
			<div>
				<h2 class="text-3xl font-bold">{h.title}</h2>
				<p class="text-muted-foreground">{h.sub}</p>
			</div>

			<h3 class="eyebrow mt-2">南加州活动</h3>
			<ul class="flex flex-col divide-y">
				{#each h.events as e (e.name)}
					<li class="flex gap-4 py-3">
						<span class="w-20 shrink-0 font-mono text-xs leading-6 text-sea">{e.when}</span>
						<div class="flex min-w-0 flex-1 flex-col gap-1">
							<b class="font-semibold">{e.name}</b>
							<small class="text-[13px] text-muted-foreground">{e.desc}</small>
							<div class="mt-1"><WishButton text={`${h.title}：${e.name}`} label="加入心愿" /></div>
						</div>
					</li>
				{/each}
			</ul>

			<h3 class="eyebrow mt-2">两个人的小计划</h3>
			<ul class="flex flex-col divide-y">
				{#each h.ideas as idea (idea)}
					<li class="flex items-center gap-4 py-3">
						<span class="flex-1 text-[15px]">{idea}</span>
						<WishButton text={`${h.title}：${idea}`} label="加入心愿" />
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
