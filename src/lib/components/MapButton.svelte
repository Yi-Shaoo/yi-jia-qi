<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import MapPin from "@lucide/svelte/icons/map-pin";

	let { q, label = "地图" }: { q: string; label?: string } = $props();
	const href = $derived(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
</script>

<Button variant="outline" size="sm" class="rounded-full" {href} target="_blank" rel="noopener external">
	<MapPin />{label}
</Button>
