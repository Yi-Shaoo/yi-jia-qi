<script lang="ts">
	import * as Sheet from "$lib/components/ui/sheet";
	import { Entry } from "$lib/components/ui/navigation-menu";
	import { Button } from "$lib/components/ui/button";
	import { NAV_GROUPS, HOME_LINK, groupOf, type NavGroup } from "$lib/nav";
	import { route } from "$lib/router.svelte";

	const active = $derived(groupOf(route.path));
	let open = $state(false);
	let group = $state<NavGroup | null>(null);
	let trigger: HTMLElement | null = null;

	function openGroup(g: NavGroup, from: HTMLElement) {
		group = g;
		trigger = from;
		open = true;
	}
	$effect(() => {
		route.path;
		open = false;
	});
</script>

<nav aria-label="主导航" class="tab-bar fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 pb-[env(safe-area-inset-bottom)] md:hidden">
	<Button href={HOME_LINK.href} variant="tab" size="tab" data-current={active === "home"} aria-current={active === "home" ? "page" : undefined}>
		<HOME_LINK.icon aria-hidden="true" />{HOME_LINK.label}
	</Button>
	{#each NAV_GROUPS as g (g.key)}
		<Button variant="tab" size="tab" data-current={active === g.key} aria-haspopup="dialog" aria-expanded={open && group?.key === g.key} onclick={(e) => openGroup(g, e.currentTarget)}>
			<g.icon aria-hidden="true" />{g.label}
		</Button>
	{/each}
</nav>

<Sheet.Root bind:open>
	<Sheet.Content side="bottom" class="max-h-[90dvh] overflow-y-auto rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+16px)]" onCloseAutoFocus={(e) => { if (trigger) { e.preventDefault(); trigger.focus({ preventScroll: true }); } }}>
		{#if group}
			<Sheet.Header><Sheet.Title>{group.label}</Sheet.Title></Sheet.Header>
			<ul class="grid gap-1 px-4">
				{#each group.links as link (link.href)}
					<li><Button variant="navigation" size="row" href={link.href} aria-current={route.path === link.href ? "page" : undefined} onclick={() => { if (link.href !== route.path) trigger = null; open = false; }}>
						<Entry label={link.label} />
					</Button></li>
				{/each}
			</ul>
		{/if}
	</Sheet.Content>
</Sheet.Root>
