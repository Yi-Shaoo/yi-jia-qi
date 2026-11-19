<script lang="ts">
	import { onMount, tick } from "svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PetCard from "$lib/components/play/PetCard.svelte";
	import DailyQuestion from "$lib/components/play/DailyQuestion.svelte";
	import Gacha from "$lib/components/play/Gacha.svelte";
	import QuestionCards from "$lib/components/play/QuestionCards.svelte";
	import MissCounter from "$lib/components/play/MissCounter.svelte";
	import Bottles from "$lib/components/play/Bottles.svelte";
	import Letters from "$lib/components/play/Letters.svelte";

	onMount(async () => {
		if (location.hash) {
			await tick();
			document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" });
		}
	});
</script>

<PageHeader
	eyebrow="Play"
	title="一起玩"
	lede="每日一问、扭蛋机、想你计数器、漂流瓶和时光信箱都不用视频也能玩；问题卡适合视频的时候一起抽。"
/>

<div class="grid items-start gap-5 lg:grid-cols-2">
	<div class="flex flex-col gap-5">
		<PetCard />
		<Gacha />
		<MissCounter />
	</div>
	<div class="flex flex-col gap-5">
		<DailyQuestion />
		<QuestionCards />
		<Bottles />
		<Letters />
	</div>
</div>
