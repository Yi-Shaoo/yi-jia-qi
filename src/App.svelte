<script lang="ts">
	import { tick, type Component } from "svelte";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";
	import { Button } from "$lib/components/ui/button";
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

	let previousPath = route.path;
	let announcement = $state("");
	$effect(() => {
		const path = route.path;
		if (previousPath === path) return;
		previousPath = path;
		announcement = current.title || "首页";
		if (location.hash || route.search) return;
		void tick().then(() => {
			if (path === route.path && !document.querySelector('[aria-modal="true"]')) {
				document.getElementById("main-content")?.focus({ preventScroll: true });
			}
		});
	});

	checkSession();
</script>

<ModeWatcher defaultMode="system" />
<Toaster position="bottom-right" offset={{ bottom: "var(--notice-bottom)", right: 24 }} mobileOffset={{ bottom: "var(--notice-bottom)", left: 16, right: 16 }} visibleToasts={1} richColors />

{#if session.verifying}
	<div id="session-verifying" role="status" aria-label="正在确认登录状态" class="fixed inset-0 z-50 flex items-center justify-center bg-background">
		<span class="font-display text-2xl font-extrabold text-muted-foreground">Yi <span class="text-coral">&amp;</span> Jia Qi</span>
	</div>
{/if}

{#key session.who}
{#if session.checked && session.unavailable}
	<main class="grid min-h-dvh place-content-center justify-items-center gap-4 px-4 text-center">
		<h1 class="text-2xl font-bold">暂时连不上小站</h1>
		<p class="text-sm text-muted-foreground">无法确认登录状态，请检查网络后重试。</p>
		<Button onclick={checkSession}>重试连接</Button>
	</main>
{:else if session.who}
	<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">跳到主要内容</a>
	<span class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
	<SiteHeader />
	<main id="main-content" tabindex="-1" class="outline-none mx-auto w-full max-w-6xl px-4 pb-28 md:px-6 md:pb-16">
		{#key route.path}
			{#if isLoader(current.page)}
				{#await current.page()}
					<div class="py-24 text-center text-muted-foreground" role="status">正在打开…</div>
				{:then mod}
					<mod.default />
				{:catch}
					<div class="flex flex-col items-center gap-3 py-24">
						<p class="text-muted-foreground" role="alert">没能打开这一页。</p>
						<Button variant="outline" onclick={() => location.reload()}>重新加载</Button>
					</div>
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
{:else if session.checked}
	<Login />
{/if}
{/key}

<style>
	:global(body:has(#session-verifying) > :not(#app)),
	:global(#app:has(#session-verifying) > :not(#session-verifying)) {
		visibility: hidden !important;
	}
</style>
