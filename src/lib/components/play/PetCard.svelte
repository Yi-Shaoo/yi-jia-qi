<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import PlayCard from "./PlayCard.svelte";
	import { useCollection } from "$lib/sync.svelte";
	import { session } from "$lib/session.svelte";
	import { heartBurst, pick, reducedMotion } from "$lib/fx";
	import { ago } from "$lib/dates";
	import { WHO, type PetState } from "$lib/types";
	import { cn } from "$lib/utils";

	let { id }: { id: string } = $props();

	/** 糯糯：两个人一起养的小宠物。饱饱 24 小时掉光，开心 12 小时掉光。 */
	const pet = useCollection("pet");
	const st = $derived<PetState>({ fedAt: 0, fedBy: "", pettedAt: 0, pettedBy: "", feeds: 0, ...(pet.get("state")?.data ?? {}) });

	let now = $state(Date.now());
	const hunger = $derived(st.fedAt ? Math.max(0, Math.round(100 - ((now - st.fedAt) / 36e5) * (100 / 24))) : 30);
	const mood = $derived(st.pettedAt ? Math.max(0, Math.round(100 - ((now - st.pettedAt) / 36e5) * (100 / 12))) : 0);
	const night = $derived(((h) => h >= 1 && h < 7)(new Date(now).getHours()));
	const status = $derived(
		night ? "在打瞌睡" : hunger < 25 ? "饿扁了，快喂我" : mood < 15 ? "有点孤单，想被摸摸" : hunger >= 60 && mood >= 50 ? "心情超好" : "在到处溜达",
	);

	// 小舞台上的走动
	let x = $state(40); // 百分比
	let dir = $state(1);
	let walking = $state(false);
	let hop = $state(false);
	let eating = $state(false);
	let sleeping = $state(false);
	let snack = $state<{ x: number; color: string } | null>(null);
	let walkMs = $state(0);
	const face = $derived(sleeping ? "sleep" : hunger < 25 || mood < 15 ? "sad" : hunger >= 60 && mood >= 50 ? "happy" : "ok");
	let say = $state("");
	let sayTimer = 0;
	let petEl = $state<HTMLElement | null>(null);

	function speak(s: string, ms = 2600) {
		say = s;
		clearTimeout(sayTimer);
		sayTimer = window.setTimeout(() => (say = ""), ms);
	}
	function walkTo(target: number, then?: () => void) {
		if (reducedMotion()) {
			then?.();
			return;
		}
		dir = target >= x ? 1 : -1;
		walking = true;
		walkMs = Math.max(300, Math.abs(target - x) * 45);
		x = target;
		window.setTimeout(() => {
			walking = false;
			then?.();
		}, walkMs);
	}

	onMount(() => {
		sleeping = night && !reducedMotion();
		const tick = window.setInterval(() => (now = Date.now()), 60_000);
		const roam = window.setInterval(() => {
			if (reducedMotion() || sleeping || walking || eating || snack || document.hidden) return;
			if (Math.random() < 0.6) walkTo(8 + Math.random() * 74);
		}, 4200);
		if (hunger < 25) setTimeout(() => speak("好饿呀…喂我一个马卡龙吧", 3800), 900);
		return () => {
			clearInterval(tick);
			clearInterval(roam);
		};
	});

	async function feed() {
		if (snack) return;
		const sx = reducedMotion() ? x : Math.max(6, Math.min(84, x + (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 25)));
		snack = { x: sx, color: pick(["#ffb5c8", "#a8e3f2", "#caf2c0", "#fde58a", "#d7c4ff"]) };
		if (sleeping) {
			sleeping = false;
			speak("闻到零食了！");
		}
		setTimeout(
			() =>
				walkTo(sx, () => {
					eating = true;
					setTimeout(() => {
						eating = false;
						snack = null;
						heartBurst(petEl);
						speak(pick(["好好吃！", "谢谢投喂～", "肚子圆滚滚了", "嗝～"]));
					}, 1100);
				}),
			reducedMotion() ? 0 : 600,
		);
		try {
			await pet.set("state", { ...st, fedAt: Date.now(), fedBy: session.who ?? "", feeds: (st.feeds ?? 0) + 1 });
			now = Date.now();
		} catch {
			toast.error("没存上，再试一次");
		}
	}
	async function pat() {
		if (sleeping) {
			sleeping = false;
			speak("唔…被你吵醒了");
			return;
		}
		hop = false;
		requestAnimationFrame(() => (hop = true));
		heartBurst(petEl);
		speak(pick(["呼噜呼噜～", "再摸摸！", "最喜欢你了", "嘿嘿"]));
		try {
			await pet.set("state", { ...st, pettedAt: Date.now(), pettedBy: session.who ?? "" });
			now = Date.now();
		} catch {
			toast.error("没存上，再试一次");
		}
	}
	const by = (k: string) => (k === "yi" || k === "jq" ? `${WHO[k]} ` : "");
</script>

<PlayCard {id} title="我们的小宠物 · 糯糯" meta={status}>
	<div class="relative h-56 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#e3eef5_0%,#f6f1e7_70%)] dark:bg-[linear-gradient(180deg,#17303f,#1a2638_70%)]">
		<div class="absolute inset-x-0 bottom-0 h-14 bg-[#e8dcc4] dark:bg-[#2e2717]"></div>
		{#if snack}
			<svg viewBox="0 0 24 24" class="absolute bottom-10 size-7 animate-pop" style:left={`${snack.x + 4}%`} aria-hidden="true">
				<rect x="3" y="5" width="18" height="6" rx="3" fill={snack.color} /><rect x="2.5" y="10.5" width="19" height="3" rx="1.5" fill="#fff4e4" /><rect x="3" y="13" width="18" height="6" rx="3" fill={snack.color} />
			</svg>
		{/if}
		<div
			class="absolute bottom-5 w-24 transition-[left] ease-linear"
			style:left={`${x}%`}
			style:transition-duration={walking ? `${walkMs}ms` : "0s"}
		>
			{#if say}<div role="status" class="absolute -top-9 left-1/2 -translate-x-1/2 animate-pop rounded-xl bg-card px-2.5 py-1 text-xs whitespace-nowrap shadow">{say}</div>{/if}
			{#if sleeping}<span class="absolute -top-2 right-1 font-mono text-sm text-muted-foreground" aria-hidden="true">z<sup>z</sup></span>{/if}
			<Button bind:ref={petEl} variant="surface" onclick={pat} aria-label="摸摸糯糯" class={cn("block w-full", hop && "animate-beat", eating && "animate-shake")}>
				<svg viewBox="0 0 100 100" aria-hidden="true" class={cn("block w-full transition-transform", walking && "animate-bounce")} style:transform={`scaleX(${dir})`}>
					<ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".1" />
					<path d="M50 30 C50 22 50 18 50 14" stroke="#7fbf86" stroke-width="3" stroke-linecap="round" fill="none" />
					<path d="M50 18 C42 10 33 13 34 20 C40 22 46 21 50 18Z" fill="#9fdcaa" /><path d="M50 16 C57 7 67 9 66 16 C60 19 54 19 50 16Z" fill="#bdeeb3" />
					<ellipse cx="50" cy="62" rx="35" ry="29" fill="#fff3e8" stroke="#f3cdb8" stroke-width="2.2" />
					<ellipse cx="38" cy="47" rx="10" ry="5" fill="#fff" opacity=".7" />
					{#if face === "sleep"}
						<path d="M36 61 q4 3 8 0 M56 61 q4 3 8 0" stroke="#4a2a36" stroke-width="2.2" fill="none" stroke-linecap="round" />
					{:else}
						<ellipse cx="40" cy="60" rx="3.6" ry="4.6" fill="#4a2a36" /><ellipse cx="60" cy="60" rx="3.6" ry="4.6" fill="#4a2a36" /><circle cx="41.3" cy="58.4" r="1.3" fill="#fff" /><circle cx="61.3" cy="58.4" r="1.3" fill="#fff" />
					{/if}
					<ellipse cx="31" cy="68" rx="5.5" ry="3.2" fill="#ff9fb8" opacity=".6" /><ellipse cx="69" cy="68" rx="5.5" ry="3.2" fill="#ff9fb8" opacity=".6" />
					{#if eating}
						<ellipse cx="50" cy="70" rx="3" ry="3.4" fill="#7a3b4b" />
					{:else if face === "sad"}
						<path d="M46 71 q4 -3 8 0" stroke="#7a3b4b" stroke-width="2" fill="none" stroke-linecap="round" />
					{:else}
						<path d="M46 68 q4 4 8 0" stroke="#7a3b4b" stroke-width="2" fill="none" stroke-linecap="round" />
					{/if}
					<ellipse cx="38" cy="89" rx="7" ry="4" fill="#ffd6c2" /><ellipse cx="62" cy="89" rx="7" ry="4" fill="#ffd6c2" />
				</svg>
			</Button>
		</div>
	</div>

	<div class="flex flex-col gap-2.5">
		{#each [["饱饱", hunger, "bg-coral"], ["开心", mood, "bg-sun"]] as const as [label, v, color] (label)}
			<div class="grid grid-cols-[40px_1fr_32px] items-center gap-3 text-sm font-semibold">
				{label}
				<div class="h-3 overflow-hidden rounded-full bg-muted"><div class={cn("h-full rounded-full transition-[width]", color)} style:width={`${v}%`}></div></div>
				<span class="text-right font-mono text-xs tabular-nums">{v}</span>
			</div>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2">
		<Button class="rounded-full" onclick={feed} disabled={!!snack}>喂一个马卡龙</Button>
		<Button variant="outline" class="rounded-full" onclick={pat}>摸摸头</Button>
	</div>
	<p class="text-[13px] text-muted-foreground">
		上次喂：{by(st.fedBy)}{ago(st.fedAt)} · 上次摸头：{by(st.pettedBy)}{ago(st.pettedAt)}{st.feeds ? ` · 一共喂了 ${st.feeds} 次` : ""}
	</p>
</PlayCard>
