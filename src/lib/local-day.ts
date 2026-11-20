import { readable } from "svelte/store";
import { todayKey } from "./dates";

export const localDay = readable(todayKey(), (set) => {
	let timer: number;
	function refresh() {
		set(todayKey());
		const midnight = new Date();
		midnight.setHours(24, 0, 0, 0);
		window.clearTimeout(timer);
		timer = window.setTimeout(refresh, Math.max(1, midnight.getTime() - Date.now()));
	}
	refresh();
	window.addEventListener("focus", refresh);
	window.addEventListener("pageshow", refresh);
	return () => {
		window.clearTimeout(timer);
		window.removeEventListener("focus", refresh);
		window.removeEventListener("pageshow", refresh);
	};
});
