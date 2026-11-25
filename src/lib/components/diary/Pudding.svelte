<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { cn } from "$lib/utils";
	import { onDestroy } from "svelte";
	import { heartBurst, pick } from "$lib/fx";

	/** 布丁：日记页的小纸杯蛋糕吉祥物，坐在最新一张日记卡片的右上沿，戳一下会说话（从旧版移植） */
	const LINES = [
		"欢迎光临，今天想点什么约会？",
		"写完记得点“发布”哦",
		"我闻到了约会的甜味",
		"再戳我奶油要掉啦",
		"你们比我还甜！",
		"今日特供：想念一份",
		"下次约会带上我好不好",
		"日记写得越多，我的草莓越大",
		"嘿嘿，被你发现了",
		"今天的你也很可爱",
	];
	let say = $state("戳戳我");
	let hop = $state(false);
	let cherry = $state(false);
	let btn = $state<HTMLButtonElement | null>(null);
	let t = 0;
	onDestroy(() => clearTimeout(t));

	/** 发布日记后：换台词、弹跳，头顶的樱桃蹦一下 */
	export function cheer(text = "盖好邮戳啦，这篇日记好甜") {
		speak(text);
		cherry = false;
		requestAnimationFrame(() => (cherry = true));
	}
	function speak(s: string) {
		say = s;
		hop = false;
		requestAnimationFrame(() => (hop = true));
		clearTimeout(t);
		t = window.setTimeout(() => (say = "戳戳我"), 4000);
	}
	function poke() {
		let s = say;
		while (s === say) s = pick(LINES);
		speak(s);
		heartBurst(btn);
	}
</script>

<div class="diary-pudding">
	<div role="status" class="pudding-bubble">{say}</div>
	<Button bind:ref={btn} variant="surface" onclick={poke} aria-label="戳一下布丁" class={cn("pudding-button", hop && "pudding-hop", cherry && "pudding-cherry-go")}>
		<svg viewBox="0 0 120 128" class="block w-full" aria-hidden="true">
			<ellipse cx="60" cy="122" rx="30" ry="4.5" fill="#000" opacity=".08" />
			<ellipse cx="18" cy="80" rx="6.5" ry="8.5" fill="#fff4e4" stroke="#ffd6c2" stroke-width="2" />
			<ellipse cx="102" cy="80" rx="6.5" ry="8.5" fill="#fff4e4" stroke="#ffd6c2" stroke-width="2" />
			<path d="M26 68 h68 l-8 44 h-52 z" fill="#a8e3f2" />
			<path d="M37 68 l4 44 M49 68 l2 44 M60 68 v44 M71 68 l-2 44 M83 68 l-4 44" stroke="#7cc0ec" stroke-width="2.2" />
			<path d="M22 72 c-7-21 10-32 23-30 c2-17 28-19 32-2 c17-4 28 13 21 32 z" fill="#fff4e4" stroke="#ffd2bd" stroke-width="2.2" />
			<path d="M34 50 q8 -6 16 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" />
			<rect x="40" y="38" width="3" height="7" rx="1.5" fill="#a8e3f2" transform="rotate(-25 41 41)" />
			<rect x="74" y="36" width="3" height="7" rx="1.5" fill="#fde58a" transform="rotate(30 75 39)" />
			<rect x="86" y="54" width="3" height="7" rx="1.5" fill="#caf2c0" transform="rotate(-10 87 57)" />
			<rect x="30" y="58" width="3" height="7" rx="1.5" fill="#d7c4ff" transform="rotate(40 31 61)" />
			<g class="pudding-cherry">
				<path d="M60 24 c-3 -8 4 -14 8 -10" fill="none" stroke="#7aa35a" stroke-width="2.4" stroke-linecap="round" />
				<circle cx="60" cy="28" r="8" fill="#f08aa6" /><circle cx="57" cy="25" r="2.2" fill="#fff" opacity=".7" />
			</g>
			<ellipse cx="50" cy="58" rx="4" ry="5" fill="#4a2a36" /><circle cx="51.5" cy="56" r="1.4" fill="#fff" />
			<ellipse cx="70" cy="58" rx="4" ry="5" fill="#4a2a36" /><circle cx="71.5" cy="56" r="1.4" fill="#fff" />
			<ellipse cx="41" cy="66" rx="5.5" ry="3.2" fill="#ff8fae" opacity=".55" /><ellipse cx="79" cy="66" rx="5.5" ry="3.2" fill="#ff8fae" opacity=".55" />
			<path d="M55 65 q5 5 10 0" fill="none" stroke="#7a3b4b" stroke-width="2.2" stroke-linecap="round" />
			<ellipse cx="46" cy="115" rx="8" ry="4.5" fill="#ffc6a8" /><ellipse cx="74" cy="115" rx="8" ry="4.5" fill="#ffc6a8" />
		</svg>
	</Button>
</div>
