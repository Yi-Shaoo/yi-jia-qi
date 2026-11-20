<script lang="ts">
	import { tick } from "svelte";

	let { text }: { text: string } = $props();
	let paragraph = $state<HTMLParagraphElement | null>(null);
	let expanded = $state(false), long = $state(false);
	const id = $props.id();
	async function toggle(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		expanded = !expanded;
		if (expanded) return;
		await tick();
		button.focus({ preventScroll: true });
		const heading = paragraph?.closest("li")?.querySelector("h2");
		if (heading && heading.getBoundingClientRect().top < 80) {
			heading.scrollIntoView({ block: "start", behavior: "instant" });
		}
	}
	$effect(() => {
		const el = paragraph;
		if (!el || !text) return;
		const measure = () => { long = el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) * 6 + 1; };
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<p bind:this={paragraph} {id} class:line-clamp-6={!expanded} class="mt-1 max-w-prose text-[15px] leading-relaxed wrap-anywhere whitespace-pre-line text-muted-foreground">{text}</p>
{#if long}
	<button type="button" aria-controls={id} aria-expanded={expanded} onclick={toggle} class="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-sea underline underline-offset-4">{expanded ? "收起正文" : "展开全文"}</button>
{/if}
