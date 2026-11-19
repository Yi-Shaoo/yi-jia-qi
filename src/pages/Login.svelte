<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { login } from "$lib/session.svelte";
	import { ApiError } from "$lib/api";

	let password = $state("");
	let error = $state("");
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!password) return;
		busy = true;
		error = "";
		try {
			await login(password);
		} catch (err) {
			error = err instanceof ApiError ? err.message : "连不上服务器，稍后再试";
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex min-h-dvh items-center justify-center px-4">
	<form onsubmit={submit} class="w-full max-w-sm rounded-3xl bg-card p-8 shadow-[0_0_0_1px_var(--border),0_24px_48px_rgb(20_37_61/0.08)]">
		<div class="film-stamp text-sm">'26 11 05</div>
		<h1 class="mt-1 font-display text-4xl font-extrabold tracking-[-0.03em]">Yi <span class="text-coral">&amp;</span> Jia Qi</h1>
		<p class="mt-2 text-sm text-muted-foreground">UCI ⇄ UCLA，405 号公路两头的我们</p>
		<div class="mt-8 flex flex-col gap-2">
			<Label for="pw">我们的暗号</Label>
			<Input id="pw" type="password" autocomplete="current-password" bind:value={password} placeholder="输入你的密码" class="h-11" />
			<p class="text-xs text-muted-foreground">Yi 和 Jia Qi 各有一个密码，用谁的密码登录就是谁。</p>
		</div>
		{#if error}<p class="mt-3 text-sm text-destructive" role="alert">{error}</p>{/if}
		<Button type="submit" class="mt-6 h-11 w-full rounded-full" disabled={busy || !password}>
			{busy ? "正在进门…" : "进门"}
		</Button>
	</form>
</div>
