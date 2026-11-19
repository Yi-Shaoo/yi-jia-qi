import { api } from "./api";
import { startSync, stopSync } from "./sync.svelte";
import type { Who } from "./types";

/** 当前登录的是谁。用哪个密码登录就是谁，所以不需要再选“我是谁”。 */
export const session = $state<{ who: Who | null; checked: boolean }>({ who: null, checked: false });

export function me(): Who {
	if (!session.who) throw new Error("not signed in");
	return session.who;
}

export async function checkSession() {
	try {
		const r = await api<{ who: Who }>("/me");
		session.who = r.who;
		startSync();
	} catch {
		session.who = null;
	} finally {
		session.checked = true;
	}
}

export async function login(password: string) {
	const r = await api<{ who: Who }>("/login", { method: "POST", body: JSON.stringify({ password }) });
	session.who = r.who;
	startSync();
	return r.who;
}

export async function logout() {
	await api("/logout", { method: "POST" }).catch(() => {});
	stopSync();
	session.who = null;
}

if (typeof window !== "undefined") {
	window.addEventListener("yjq:unauthorized", () => {
		if (session.who) {
			stopSync();
			session.who = null;
		}
	});
}
