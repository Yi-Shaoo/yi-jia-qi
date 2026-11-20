<script lang="ts">
	import * as NavigationMenu from "$lib/components/ui/navigation-menu";
	import { HOME_LINK, NAV_GROUPS, groupOf } from "$lib/nav";

	let { path }: { path: string } = $props();
</script>

<NavigationMenu.Root aria-label="主导航" class="hidden md:flex" viewport={false}>
	<NavigationMenu.List>
		<NavigationMenu.Item>
			<NavigationMenu.Link href={HOME_LINK.href} active={path === HOME_LINK.href}>{HOME_LINK.label}</NavigationMenu.Link>
		</NavigationMenu.Item>
		{#each NAV_GROUPS as group (group.key)}
			<NavigationMenu.Item>
				<NavigationMenu.Trigger data-current={groupOf(path) === group.key}>{group.label}</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="grid gap-1">
						{#each group.links as link (link.href)}
							<li><NavigationMenu.Link href={link.href} active={path === link.href}>
								<NavigationMenu.Entry label={link.label} />
							</NavigationMenu.Link></li>
						{/each}
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item>
		{/each}
	</NavigationMenu.List>
</NavigationMenu.Root>
