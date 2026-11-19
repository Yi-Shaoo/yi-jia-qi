<script lang="ts">
	import type { Component } from "svelte";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";
	import SiteHeader from "$lib/components/layout/SiteHeader.svelte";
	import MobileTabBar from "$lib/components/layout/MobileTabBar.svelte";
	import { route } from "$lib/router.svelte";
	import { session, checkSession } from "$lib/session.svelte";
	import Login from "./pages/Login.svelte";
	import Home from "./pages/Home.svelte";

	type Loader = () => Promise<{ default: Component }>;
	const ROUTES: Record<string, { page: Component | Loader; title: string }> = {
		"/": { page: Home, title: "" },
		"/diary": { page: () => import("./pages/Diary.svelte"), title: "约会日记" },
		"/memories": { page: () => import("./pages/Memories.svelte"), title: "我们的回忆" },
		"/album": { page: () => import("./pages/Album.svelte"), title: "情侣相册" },
		"/about": { page: () => import("./pages/About.svelte"), title: "关于我们" },
		"/play": { page: () => import("./pages/Play.svelte"), title: "一起玩" },
		"/wish": { page: () => import("./pages/Wish.svelte"), title: "心愿清单" },
		"/dates": { page: () => import("./pages/Dates.svelte"), title: "约会去哪" },
		"/food": { page: () => import("./pages/Food.svelte"), title: "今天吃什么" },
		"/roadtrip": { page: () => import("./pages/Roadtrip.svelte"), title: "Road-trip" },
		"/holiday": { page: () => import("./pages/Holiday.svelte"), title: "感恩节和圣诞" },
	};
	const NOT_FOUND = { page: (() => import("./pages/NotFound.svelte")) as Loader, title: "找不到这一页" };
	const isLoader = (p: Component | Loader): p is Loader => p !== Home;

	const current = $derived(ROUTES[route.path] ?? NOT_FOUND);

	$effect(() => {
		document.title = current.title ? `${current.title} · Yi & Jia Qi` : "Yi & Jia Qi";
	});

	checkSession();
</script>

<ModeWatcher defaultMode="light" />
<Toaster position="top-center" richColors />

{#if !session.checked}
	<div class="flex min-h-dvh items-center justify-center">
		<span class="font-display text-2xl font-extrabold text-muted-foreground">Yi <span class="text-coral">&amp;</span> Jia Qi</span>
	</div>
{:else if !session.who}
	<Login />
{:else}
	<SiteHeader />
	<main class="mx-auto w-full max-w-6xl px-4 pb-28 md:px-6 md:pb-16">
		{#key route.path}
			{#if isLoader(current.page)}
				{#await current.page()}
					<div class="py-24 text-center text-muted-foreground">正在打开…</div>
				{:then mod}
					<mod.default />
				{:catch}
					<div class="py-24 text-center text-muted-foreground">页面没加载出来，刷新一下试试</div>
				{/await}
			{:else}
				<current.page />
			{/if}
		{/key}
	</main>
	<footer class="mx-auto hidden max-w-6xl justify-between px-6 pb-10 text-[13px] text-muted-foreground md:flex">
		<span>Yi &amp; Jia Qi · 从 2026.11.05 开始</span>
		<span>UCI ⇄ UCLA</span>
	</footer>
	<MobileTabBar />
{/if}
