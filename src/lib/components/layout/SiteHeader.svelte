<script lang="ts">
	import * as NavigationMenu from "$lib/components/ui/navigation-menu";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Button } from "$lib/components/ui/button";
	import WhoBadge from "$lib/components/WhoBadge.svelte";
	import { NAV_GROUPS, groupOf } from "$lib/nav";
	import { route } from "$lib/router.svelte";
	import { session, logout } from "$lib/session.svelte";
	import { syncState } from "$lib/sync.svelte";
	import { WHO } from "$lib/types";
	import { cn } from "$lib/utils";
	import { toggleMode, mode } from "mode-watcher";
	import PenLine from "@lucide/svelte/icons/pen-line";
	import Moon from "@lucide/svelte/icons/moon";
	import Sun from "@lucide/svelte/icons/sun";
	import LogOut from "@lucide/svelte/icons/log-out";

	const active = $derived(groupOf(route.path));
</script>

<header class="sticky top-0 z-40 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:h-[72px] md:gap-8 md:px-6">
		<a href="/" class="font-display text-[19px] font-extrabold tracking-[-0.03em] md:text-[22px]">
			Yi <span class="text-coral">&amp;</span> Jia Qi
		</a>

		<NavigationMenu.Root class="hidden md:flex" viewport={false}>
			<NavigationMenu.List class="gap-1">
				<NavigationMenu.Item>
					<NavigationMenu.Link
						href="/"
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
											class={cn(
												"flex-col items-start gap-0.5 rounded-xl p-3",
												route.path === l.href && "bg-muted",
											)}
										>
											<span class="font-semibold">{l.label}</span>
											<span class="text-[13px] leading-snug text-muted-foreground">{l.desc}</span>
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
			<span
				class={cn("size-2 rounded-full", syncState.connected ? "bg-emerald-500" : "bg-amber-400")}
				title={syncState.connected ? "和对方实时同步中" : "正在重新连接…"}
			></span>
			<span class="sr-only">{syncState.connected ? "实时同步中" : "正在重新连接"}</span>
			{#if session.who}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button {...props} class="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="账号菜单">
								<WhoBadge who={session.who!} />
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-48">
						<DropdownMenu.Label>我是 {WHO[session.who]}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={toggleMode}>
							{#if mode.current === "dark"}<Sun />浅色模式{:else}<Moon />深色模式{/if}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={logout}><LogOut />退出登录</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
			<Button href="/diary?write=today" class="hidden h-10 rounded-full px-5 md:inline-flex">
				<PenLine />写下今天
			</Button>
		</div>
	</div>
</header>
