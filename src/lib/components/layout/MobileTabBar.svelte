<script lang="ts">
	import * as Sheet from "$lib/components/ui/sheet";
	import { NAV_GROUPS, HOME_LINK, groupOf, type NavGroup } from "$lib/nav";
	import { route } from "$lib/router.svelte";
	import { cn } from "$lib/utils";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";

	const active = $derived(groupOf(route.path));
	let open = $state(false);
	let group = $state<NavGroup | null>(null);

	function openGroup(g: NavGroup) {
		group = g;
		open = true;
	}
	$effect(() => {
		route.path;
		open = false;
	});
</script>

<nav
	aria-label="主导航"
	class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
>
	<a
		href={HOME_LINK.href}
		class={cn(
			"flex h-16 flex-col items-center justify-center gap-0.5 text-[11px]",
			active === "home" ? "font-semibold text-sea" : "text-muted-foreground",
		)}
		aria-current={active === "home" ? "page" : undefined}
	>
		<span class={cn("grid h-7 w-12 place-items-center rounded-full", active === "home" && "bg-secondary")}><HOME_LINK.icon aria-hidden="true" class="size-5" /></span>
		{HOME_LINK.label}
	</a>
	{#each NAV_GROUPS as g (g.key)}
		<button
			type="button"
			onclick={() => openGroup(g)}
			aria-haspopup="dialog"
			aria-expanded={open && group?.key === g.key}
			class={cn(
				"flex h-16 flex-col items-center justify-center gap-0.5 text-[11px]",
				active === g.key ? "font-semibold text-sea" : "text-muted-foreground",
			)}
		>
			<span class={cn("grid h-7 w-12 place-items-center rounded-full", active === g.key && "bg-secondary")}><g.icon aria-hidden="true" class="size-5" /></span>
			{g.label}
		</button>
	{/each}
</nav>

<Sheet.Root bind:open>
	<Sheet.Content side="bottom" class="max-h-[90dvh] overflow-y-auto rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+16px)]">
		{#if group}
			<Sheet.Header>
				<Sheet.Title class="font-display text-xl">{group.label}</Sheet.Title>
			</Sheet.Header>
			<ul class="flex flex-col gap-1 px-4">
				{#each group.links as l (l.href)}
					<li>
						<a
							href={l.href}
							aria-current={route.path === l.href ? "page" : undefined}
							onclick={() => (open = false)}
							class={cn(
								"flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2",
								route.path === l.href ? "bg-secondary" : "hover:bg-muted",
							)}
						>
							<span class="flex size-10 items-center justify-center rounded-xl bg-muted text-sea"><l.icon class="size-5" /></span>
							<span class="flex flex-1 flex-col">
								<span class="font-semibold">{l.label}</span>
								{#if l.desc}<span class="text-[13px] text-muted-foreground">{l.desc}</span>{/if}
							</span>
							<ChevronRight class="size-4 text-muted-foreground" />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</Sheet.Content>
</Sheet.Root>
