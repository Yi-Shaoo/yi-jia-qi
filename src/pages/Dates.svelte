<script lang="ts">
	import PlaceCatalog from "$lib/components/places/PlaceCatalog.svelte";
	import CollectionNotice from "$lib/components/CollectionNotice.svelte";
	import { useCollection } from "$lib/sync.svelte";

	const spots = useCollection("spots");
</script>

<PlaceCatalog spotsSettled={spots.status !== "loading"} kind="date" title="约会去哪">
	{#snippet spotsNotice()}
		{#if spots.status === "error"}<CollectionNotice status={spots.status} retry={() => spots.load()} label="地点照片和攻略进度" />{/if}
	{/snippet}
</PlaceCatalog>
