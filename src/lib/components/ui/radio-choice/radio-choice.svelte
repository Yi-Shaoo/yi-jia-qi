<script lang="ts" generics="K extends string">
	import { Label } from "$lib/components/ui/label";
	import { cn } from "$lib/utils";

	let { name, value, label, selected = $bindable(), variant = "chip" }: {
		name: string; value: K; label: string; selected: K; variant?: "chip" | "segment";
	} = $props();
</script>

<Label class={cn("group relative cursor-pointer", variant === "segment" ? "min-w-0" : "shrink-0")}>
	<input class="peer sr-only" type="radio" {name} {value} checked={selected === value} onchange={() => (selected = value)} />
	<span class={cn("inline-flex min-h-11 w-full items-center justify-center rounded-full px-3 text-center text-sm font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring", variant === "chip" ? "border border-border px-4 peer-not-checked:group-hover:bg-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground md:min-h-[var(--chip-min-height,2.25rem)]" : "text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm")}>{label}</span>
</Label>
