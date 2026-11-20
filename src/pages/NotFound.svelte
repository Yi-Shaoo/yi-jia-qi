<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card } from "$lib/components/ui/card";
	import PageHeader from "$lib/components/PageHeader.svelte";
</script>

<Card variant="surface" class="mx-auto mt-8 max-w-lg p-5 md:mt-16 md:p-6">
	<span class="font-mono text-sm text-muted-foreground">404</span>
	<PageHeader title="这一页走丢了" lede="可能是链接写错了。" />
	<Button href="/">回首页</Button>
</Card>
