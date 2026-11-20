<script lang="ts">
	import Plus from "@lucide/svelte/icons/plus";
	import { Button } from "$lib/components/ui/button";

	let { kind, onclick }: { kind: "date" | "food"; onclick: () => void } = $props();
</script>

<Button class="rounded-full" {onclick}><Plus />{kind === "date" ? "添加地点" : "添加餐厅"}</Button>
