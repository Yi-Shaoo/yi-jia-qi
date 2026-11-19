<script lang="ts">
	import type { ArtIcon } from "$lib/data/content";

	/** 地点卡片空拍立得里的小插画（从旧版移植） */
	let { icon, ci = 0 }: { icon: ArtIcon; ci?: number } = $props();

	const PALETTE = [
		["#ffd6e0", "#e8577a"],
		["#d8eeff", "#4f93c9"],
		["#d4f5e9", "#3f9e78"],
		["#fff2c2", "#cf9a12"],
		["#e9e0ff", "#8467d4"],
		["#ffe3cf", "#de7f3e"],
	];
	const c = $derived(PALETTE[ci % PALETTE.length]);
	const f = $derived(c[1]);
	const w = "#ffffff";
</script>

<svg viewBox="0 0 60 48" aria-hidden="true" class="block size-full">
	<rect width="60" height="48" fill={c[0]} />
	{#if icon === "wave"}
		<circle cx="44" cy="14" r="6" fill={w} /><path d="M0 30 q7.5-6 15 0 t15 0 t15 0 t15 0V48H0Z" fill={f} opacity=".55" /><path d="M0 37 q7.5-6 15 0 t15 0 t15 0 t15 0V48H0Z" fill={f} />
	{:else if icon === "sun"}
		<circle cx="30" cy="32" r="11" fill={f} /><rect y="32" width="60" height="16" fill={w} opacity=".85" /><path d="M8 38h44M14 43h32" stroke={f} stroke-width="2.2" stroke-linecap="round" /><path d="M30 12v5M16 19l3 3M44 19l-3 3" stroke={f} stroke-width="2.2" stroke-linecap="round" />
	{:else if icon === "house"}
		<path d="M14 26 30 13 46 26" fill="none" stroke={f} stroke-width="3" stroke-linejoin="round" stroke-linecap="round" /><rect x="18" y="25" width="24" height="16" rx="2" fill={w} /><rect x="27" y="31" width="6" height="10" rx="1.5" fill={f} /><rect x="0" y="41" width="60" height="7" fill={f} opacity=".4" />
	{:else if icon === "tree"}
		<rect x="28" y="26" width="4" height="15" rx="2" fill={f} /><circle cx="30" cy="20" r="10" fill={f} opacity=".85" /><circle cx="24" cy="24" r="6" fill={f} /><circle cx="37" cy="23" r="6" fill={f} /><rect y="40" width="60" height="8" fill={w} opacity=".8" />
	{:else if icon === "mtn"}
		<path d="M2 42 20 16 34 36 42 24 58 42Z" fill={f} /><path d="M20 16 15 23h10Z" fill={w} /><circle cx="48" cy="12" r="5" fill={w} />
	{:else if icon === "moon"}
		<path d="M34 10a12 12 0 1 0 10 19 10 10 0 1 1-10-19Z" fill={w} /><g fill={f}><circle cx="12" cy="12" r="1.8" /><circle cx="50" cy="10" r="1.4" /><circle cx="20" cy="34" r="1.4" /><circle cx="52" cy="36" r="1.8" /></g>
	{:else if icon === "wheel"}
		<circle cx="30" cy="22" r="13" fill="none" stroke={f} stroke-width="2.5" /><path d="M30 9v26M17 22h26M21 13l18 18M39 13 21 31" stroke={f} stroke-width="1.6" /><circle cx="30" cy="22" r="3" fill={w} /><path d="M30 22 22 42M30 22l8 20" stroke={f} stroke-width="2.5" stroke-linecap="round" />
	{:else if icon === "boat"}
		<path d="M30 8v24" stroke={f} stroke-width="2" /><path d="M31 10 45 30H31Z" fill={w} /><path d="M12 33h36l-6 8H18Z" fill={f} /><path d="M0 43 q7.5-4 15 0 t15 0 t15 0 t15 0V48H0Z" fill={w} opacity=".8" />
	{:else if icon === "flower"}
		<g fill={f}><circle cx="30" cy="15" r="6" /><circle cx="39" cy="21" r="6" /><circle cx="36" cy="31" r="6" /><circle cx="24" cy="31" r="6" /><circle cx="21" cy="21" r="6" /></g><circle cx="30" cy="23" r="5" fill={w} /><path d="M30 34v10" stroke={f} stroke-width="2.4" />
	{:else if icon === "art"}
		<rect x="13" y="8" width="34" height="30" rx="2" fill={w} stroke={f} stroke-width="3" /><path d="M17 34 26 22 32 29 36 25 43 34Z" fill={f} /><circle cx="38" cy="16" r="3" fill={f} />
	{:else if icon === "cup"}
		<path d="M20 20h20l-3 20H23Z" fill={w} stroke={f} stroke-width="2.5" stroke-linejoin="round" /><path d="M40 24h3a4 4 0 0 1 0 8h-4" fill="none" stroke={f} stroke-width="2.5" /><path d="M26 10q-3 3 0 6M32 8q-3 4 0 8" stroke={f} stroke-width="2" fill="none" stroke-linecap="round" />
	{:else if icon === "fish"}
		<ellipse cx="27" cy="24" rx="13" ry="8" fill={f} /><path d="M39 24 50 16v16Z" fill={f} /><circle cx="21" cy="22" r="2" fill={w} /><circle cx="12" cy="12" r="2.5" fill="none" stroke={w} stroke-width="1.5" /><circle cx="16" cy="6" r="1.6" fill="none" stroke={w} stroke-width="1.3" />
	{:else if icon === "castle"}
		<path d="M14 42V20h6v-4h4v4h12v-4h4v4h6v22Z" fill={w} /><path d="M24 42v-8a6 6 0 0 1 12 0v8Z" fill={f} /><path d="M17 20 17 12 20 16M43 20V12l-3 4" stroke={f} stroke-width="2" fill="none" /><rect y="42" width="60" height="6" fill={f} opacity=".5" />
	{:else if icon === "light"}
		<path d="M25 42 27 14h6l2 28Z" fill={w} /><path d="M26 22h8M26 31h8" stroke={f} stroke-width="3" /><rect x="25" y="8" width="10" height="6" rx="1" fill={f} /><path d="M35 10 52 5M35 12l17 4" stroke={w} stroke-width="2" opacity=".9" /><rect y="42" width="60" height="6" fill={f} />
	{:else if icon === "steps"}
		<path d="M6 42h10v-7h10v-7h10v-7h10v-7h8" fill="none" stroke={f} stroke-width="3" stroke-linejoin="round" /><path d="M0 46 q7.5-4 15 0 t15 0 t15 0 t15 0" stroke={w} stroke-width="2.5" fill="none" />
	{:else if icon === "star"}
		<path d="M30 8l4 9 10 1-7.5 6.5L39 34l-9-5-9 5 2.5-9.5L16 18l10-1Z" fill={w} /><g fill={f}><circle cx="12" cy="36" r="2" /><circle cx="48" cy="38" r="1.6" /><circle cx="50" cy="10" r="1.6" /></g>
	{:else}
		<path d="M30 40C14 30 12 22 16 17c4-5 11-4 14 2 3-6 10-7 14-2 4 5 2 13-14 23Z" fill={f} /><circle cx="22" cy="20" r="2.5" fill={w} opacity=".8" />
	{/if}
</svg>
