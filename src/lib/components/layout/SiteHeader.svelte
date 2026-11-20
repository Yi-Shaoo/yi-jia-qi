<script lang="ts">
	import DesktopNavigation from "./DesktopNavigation.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Button } from "$lib/components/ui/button";
	import WhoBadge from "$lib/components/WhoBadge.svelte";
	import { route } from "$lib/router.svelte";
	import { session, logout } from "$lib/session.svelte";
	import { syncState } from "$lib/sync.svelte";
	import { WHO } from "$lib/types";
	import { setMode, userPrefersMode } from "mode-watcher";
	import Monitor from "@lucide/svelte/icons/monitor";
	import Moon from "@lucide/svelte/icons/moon";
	import Sun from "@lucide/svelte/icons/sun";
	import LogOut from "@lucide/svelte/icons/log-out";

</script>

<header data-motion="none" class="site-header sticky top-0 z-40">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-[72px] md:px-6 lg:gap-8">
		<a href="/" class="site-logo shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-ring">Yi <span>&amp;</span> Jia Qi</a>
		<DesktopNavigation path={route.path} />
		<div class="ml-auto flex items-center gap-2">
			<span role="status" class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
				<i aria-hidden="true" class={["size-2 rounded-full", syncState.connected ? "bg-emerald-500" : "bg-amber-400"]}></i>
				<span class:sr-only={!syncState.reconnecting}>{syncState.connected ? "实时同步中" : syncState.reconnecting ? "正在重连" : "正在连接"}</span>
			</span>
			{#if session.who}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon" aria-label="账号菜单"><WhoBadge who={session.who!} /></Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" data-motion="none" class="w-48">
						<DropdownMenu.Label>我是 {WHO[session.who]}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.RadioGroup value={userPrefersMode.current} aria-label="外观" onValueChange={(value) => { if (value === 'system' || value === 'light' || value === 'dark') setMode(value); }}>
							<DropdownMenu.RadioItem value="system"><Monitor />跟随系统</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="light"><Sun />浅色模式</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="dark"><Moon />深色模式</DropdownMenu.RadioItem>
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={logout}><LogOut />退出登录</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>
</header>
