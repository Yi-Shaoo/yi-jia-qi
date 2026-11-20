<script lang="ts">
	import * as NavigationMenu from "$lib/components/ui/navigation-menu";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Button } from "$lib/components/ui/button";
	import WhoBadge from "$lib/components/WhoBadge.svelte";
	import { NAV_GROUPS, groupOf } from "$lib/nav";
	import { route } from "$lib/router.svelte";
	import { session, logout } from "$lib/session.svelte";
	import { syncState, useCollection } from "$lib/sync.svelte";
	import { todayDiaryAction } from "$lib/components/diary/drafts";
	import { localDay } from "$lib/local-day";
	import { WHO } from "$lib/types";
	import { cn } from "$lib/utils";
	import { setMode, userPrefersMode } from "mode-watcher";
	import Monitor from "@lucide/svelte/icons/monitor";
	import PenLine from "@lucide/svelte/icons/pen-line";
	import Moon from "@lucide/svelte/icons/moon";
	import Sun from "@lucide/svelte/icons/sun";
	import LogOut from "@lucide/svelte/icons/log-out";

	const active = $derived(groupOf(route.path));
	const diary = useCollection("diary");
	const diaryAction = $derived(todayDiaryAction(diary, session.who, $localDay));
	const diaryLabels = { "今日日记": "今日日记", "继续写草稿": "继续写日记草稿", "改我的这一边": "改今天的日记", "写下今天": "写今天的日记" } as const;
</script>

<header class="site-header sticky top-0 z-40">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:h-[72px] md:gap-8 md:px-6">
		<a href="/" class="site-logo font-display text-[19px] font-extrabold tracking-[-0.03em] md:text-[22px]">
			Yi <span class="text-coral">&amp;</span> Jia Qi
		</a>

		<NavigationMenu.Root class="hidden md:flex" viewport={false}>
			<NavigationMenu.List class="gap-1">
				<NavigationMenu.Item>
					<NavigationMenu.Link
						href="/"
						active={route.path === "/"}
						class={cn(
							"h-9 rounded-full px-4 py-0 font-medium text-muted-foreground",
							active === "home" && "bg-card text-foreground shadow-sm",
						)}
					>
						首页
					</NavigationMenu.Link>
				</NavigationMenu.Item>
				{#each NAV_GROUPS as g (g.key)}
					<NavigationMenu.Item>
						<NavigationMenu.Trigger
							class={cn(
								"h-9 rounded-full px-4 text-muted-foreground",
								active === g.key && "bg-card text-foreground shadow-sm",
							)}
						>
							{g.label}
						</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<ul class="grid w-[480px] grid-cols-2 gap-1 p-1">
								{#each g.links as l (l.href)}
									<li>
										<NavigationMenu.Link
											href={l.href}
											active={route.path === l.href}
											class={cn(
												"flex-row items-center gap-3 rounded-xl p-3",
												route.path === l.href && "bg-muted",
											)}
										>
											<span class="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><l.icon aria-hidden="true" class="size-4" /></span>
											<span><span class="block font-semibold">{l.label}</span>{#if l.desc}<span class="block text-[13px] leading-snug text-muted-foreground">{l.desc}</span>{/if}</span>
										</NavigationMenu.Link>
									</li>
								{/each}
							</ul>
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				{/each}
			</NavigationMenu.List>
		</NavigationMenu.Root>

		<div class="ml-auto flex items-center gap-2">
			<span role="status" class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
				<i aria-hidden="true" class={cn("size-2 rounded-full", syncState.connected ? "bg-emerald-500" : "bg-amber-400")}></i>
				<span class:sr-only={!syncState.reconnecting}>{syncState.connected ? "实时同步中" : syncState.reconnecting ? "正在重连" : "正在连接"}</span>
			</span>
			{#if session.who}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button {...props} class="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="账号菜单">
								<WhoBadge who={session.who!} />
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-48">
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
			{#if route.path !== "/diary"}
				<Button href="/diary?write=today" class="hidden h-10 rounded-full px-5 md:inline-flex"><PenLine />{route.path === "/" ? diaryAction.label : diaryLabels[diaryAction.label]}</Button>
			{/if}
		</div>
	</div>
</header>
