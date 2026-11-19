<script lang="ts">
	import Plus from "@lucide/svelte/icons/plus";

	let { kind, onclick }: { kind: "date" | "food"; onclick: () => void } = $props();
</script>

<button
	type="button"
	{onclick}
	class="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-sea hover:bg-card"
>
	<span class="flex size-11 items-center justify-center rounded-full bg-sea-soft text-sea"><Plus class="size-5" /></span>
	<b class="font-display text-lg">{kind === "date" ? "加一个我们的地方" : "加一家我们的店"}</b>
	<small class="text-[13px] text-muted-foreground">自己写名字、介绍和小贴士，两个人都能看到</small>
</button>
