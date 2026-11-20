<script lang="ts">
	import { cardSurface } from "$lib/components/ui/card";
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { login } from "$lib/session.svelte";
	import { ApiError } from "$lib/api";

	let password = $state("");
	let error = $state("");
	let busy = $state(false);
	let invalid = $state(false), unlockAt = $state(0), now = $state(Date.now());
	const waitKey = "yjq:login-retry-at";
	function setWait(until: number) {
		unlockAt = until;
		try {
			if (until) sessionStorage.setItem(waitKey, String(until));
			else sessionStorage.removeItem(waitKey);
		} catch {}
	}
	onMount(() => {
		try {
			const until = Number(sessionStorage.getItem(waitKey));
			if (until > now && until <= now + 600_000) { unlockAt = until; error = "登录暂时受限"; }
			else setWait(0);
		} catch {}
	});
	const minutes = $derived(Math.ceil(Math.max(0, unlockAt - now) / 60_000));
	$effect(() => {
		if (!unlockAt) return;
		const timer = window.setInterval(() => {
			now = Date.now();
			if (now >= unlockAt) { setWait(0); error = ""; }
		}, 1000);
		return () => clearInterval(timer);
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!password || busy || minutes) return;
		invalid = false;
		busy = true;
		error = "";
		try {
			await login(password);
		} catch (err) {
			invalid = err instanceof ApiError && err.status === 401;
			error = err instanceof ApiError ? err.message : "连不上服务器，稍后再试";
			if (err instanceof ApiError && err.status === 429 && err.retryAfter) {
				now = Date.now();
				setWait(now + err.retryAfter * 1000);
			}
		} finally {
			busy = false;
		}
	}
</script>

<main class="mx-auto grid min-h-dvh w-full max-w-md content-center gap-6 px-4 py-8">
	<div class="text-center">
		<h1 class="site-logo">Yi <span>&amp;</span> Jia Qi</h1>
		<p class="mt-3 text-sm text-balance text-muted-foreground">UCI ⇄ UCLA，405 号公路两头的我们</p>
	</div>
	<form onsubmit={submit} class={[cardSurface, "grid gap-4 p-5 md:p-6"]}>
		<div class="grid gap-2">
			<Label for="pw">我们的暗号</Label>
			<Input id="pw" type="password" autocomplete="current-password" bind:value={password} oninput={() => { invalid = false; if (!minutes) error = ""; }} aria-invalid={invalid} aria-describedby={error ? "pw-error pw-hint" : "pw-hint"} class="h-11" />
			<p id="pw-hint" class="text-xs text-muted-foreground">用自己的密码，以自己的身份进入。</p>
		</div>
		{#if error}<p id="pw-error" class="text-sm text-balance text-destructive" role="alert">{minutes ? `登录暂时受限，约 ${minutes} 分钟后可重试。` : error}</p>{/if}
		<Button type="submit" disabled={busy || !!minutes || !password}>
			{busy ? "正在进门…" : "进门"}
		</Button>
	</form>
</main>
