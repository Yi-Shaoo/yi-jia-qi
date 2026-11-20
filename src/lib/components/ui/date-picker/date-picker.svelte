<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { Button } from "$lib/components/ui/button";
	import * as Popover from "$lib/components/ui/popover";
	import { cn } from "$lib/utils";
	import DatePickerCalendar from "./date-picker-calendar.svelte";

	let {
		id,
		value = $bindable(""),
		min,
		disabled = false,
		class: className,
		"aria-invalid": invalid,
		"aria-describedby": description,
		onValueChange,
	}: {
		id: string;
		value?: string;
		min?: string;
		disabled?: boolean;
		class?: string;
		"aria-invalid"?: boolean;
		"aria-describedby"?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let content = $state<HTMLDivElement | null>(null);
	const valueId = $derived(`${id}-value`);

	function focusDay(event: Event) {
		const day = content?.querySelector<HTMLElement>('[data-bits-day][tabindex="0"]');
		if (!day) return;
		event.preventDefault();
		day.focus({ preventScroll: true });
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger {id} {disabled}>
		{#snippet child({ props })}
			<Button {...props} variant="outline" data-empty={!value} aria-invalid={invalid}
				aria-describedby={description ? `${valueId} ${description}` : valueId}
				class={cn("min-h-11 w-full justify-between text-start font-normal data-[empty=true]:text-muted-foreground", className)}>
				<span id={valueId}>{value || "选择日期"}</span>
				<CalendarIcon data-icon="inline-end" aria-hidden="true" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content bind:ref={content} align="start" class="w-auto p-0" role="dialog" aria-label="选择日期" onOpenAutoFocus={focusDay}>
		<DatePickerCalendar bind:value {min} {disabled} onValueChange={(date) => { open = false; onValueChange?.(date); }} />
	</Popover.Content>
</Popover.Root>
