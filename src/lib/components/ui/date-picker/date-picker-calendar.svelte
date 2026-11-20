<script lang="ts">
	import { parseDate, type DateValue } from "@internationalized/date";
	import { Calendar } from "$lib/components/ui/calendar";

	let {
		value = $bindable(""),
		min,
		disabled = false,
		onValueChange,
	}: {
		value?: string;
		min?: string;
		disabled?: boolean;
		onValueChange?: (value: string) => void;
	} = $props();

	function calendarDate(date?: string) {
		if (!date) return;
		try { return parseDate(date); } catch { return undefined; }
	}

	const minValue = $derived(calendarDate(min));
	const selected = $derived(calendarDate(value));
	const date = $derived(selected && (!minValue || selected.compare(minValue) >= 0) ? selected : undefined);

	function select(next: DateValue | undefined) {
		if (!next) return;
		value = next.toString();
		onValueChange?.(value);
	}
</script>

<Calendar type="single" value={date} placeholder={date ?? minValue} {minValue} {disabled} onValueChange={select}
	locale="zh-CN" calendarLabel="选择日期" captionLayout="dropdown" initialFocus preventDeselect />
