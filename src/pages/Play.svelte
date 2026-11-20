<script lang="ts">
	import { onMount } from "svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PetCard from "$lib/components/play/PetCard.svelte";
	import DailyQuestion from "$lib/components/play/DailyQuestion.svelte";
	import Gacha from "$lib/components/play/Gacha.svelte";
	import QuestionCards from "$lib/components/play/QuestionCards.svelte";
	import MissCounter from "$lib/components/play/MissCounter.svelte";
	import Bottles from "$lib/components/play/Bottles.svelte";
	import Letters from "$lib/components/play/Letters.svelte";
	import CalendarHeart from "@lucide/svelte/icons/calendar-heart";
	import PawPrint from "@lucide/svelte/icons/paw-print";
	import Dices from "@lucide/svelte/icons/dices";
	import Layers from "@lucide/svelte/icons/layers";
	import Heart from "@lucide/svelte/icons/heart";
	import Waves from "@lucide/svelte/icons/waves";
	import Mail from "@lucide/svelte/icons/mail";

	const modules = [
		["daily", "每日一问", CalendarHeart, DailyQuestion], ["pet", "糯糯", PawPrint, PetCard],
		["gacha", "扭蛋机", Dices, Gacha], ["questions", "问题卡", Layers, QuestionCards],
		["miss", "想你计数器", Heart, MissCounter], ["bottles", "漂流瓶", Waves, Bottles],
		["letters", "时光信箱", Mail, Letters],
	] as const;

	let current = $state("daily");
	let rail: HTMLElement;
	function mark(id: string) {
		current = id;
		const tab = rail?.querySelector<HTMLAnchorElement>(`a[href="#${id}"]`);
		if (tab && rail.scrollWidth > rail.clientWidth) {
			const diff = tab.getBoundingClientRect().left - rail.getBoundingClientRect().left;
			if (diff < 0 || diff + tab.offsetWidth > rail.clientWidth) rail.scrollLeft += diff - (rail.clientWidth - tab.offsetWidth) / 2;
		}
	}
	function focusModule() {
		const id = location.hash.slice(1);
		if (!modules.some(([key]) => key === id)) return;
		mark(id);
		const card = document.getElementById(id);
		card?.scrollIntoView({ block: "start" });
		card?.querySelector("h2")?.focus({ preventScroll: true });
	}
	function jump(event: MouseEvent, id: string) {
		if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
		focusModule();
	}
	onMount(() => {
		focusModule();
		const mq = matchMedia("(max-width: 767px)");
		let frame = 0;
		function track() {
			if (frame || !mq.matches) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				const edge = rail.getBoundingClientRect().bottom + 20;
				const id = [...modules].reverse().find(([id]) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= edge)?.[0] ?? "daily";
				if (current !== id) mark(id);
			});
		}
		window.addEventListener("scroll", track, { passive: true });
		return () => { window.removeEventListener("scroll", track); cancelAnimationFrame(frame); };
	});
</script>

<svelte:window onhashchange={focusModule} />
<PageHeader title="一起玩" />

<nav bind:this={rail} aria-label="一起玩模块" class="sticky top-16 z-30 -mx-4 mb-4 flex gap-2 overflow-x-auto border-b bg-background px-4 py-2 md:static md:mx-0 md:flex-wrap md:border-0 md:px-0">
	{#each modules as [id, label, Icon] (id)}
		<a href={`#${id}`} onclick={(event) => jump(event, id)} aria-current={current === id ? "location" : undefined} class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border bg-card px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-[current=location]:border-sea aria-[current=location]:bg-sea-soft aria-[current=location]:text-sea">
			<Icon aria-hidden="true" class="size-4" />{label}
		</a>
	{/each}
</nav>

<div class="grid items-stretch gap-5 lg:grid-cols-2">
	{#each modules as [id, , , Card] (id)}
		<Card {id} />
	{/each}
</div>
