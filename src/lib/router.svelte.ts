/** 一个很小的 history 路由：拦截站内 <a href> 点击，不刷新页面切换。 */

export const route = $state({ path: normalize(location.pathname), search: location.search });

function normalize(p: string) {
	return p.replace(/\/+$/, "") || "/";
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
	const url = new URL(to, location.href);
	if (opts.replace) history.replaceState(null, "", url);
	else history.pushState(null, "", url);
	route.path = normalize(url.pathname);
	route.search = url.search;
	window.scrollTo({ top: 0 });
}

export function replaceQuery(values: Record<string, string | null>) {
	const url = new URL(location.href);
	for (const [name, value] of Object.entries(values)) {
		if (value) url.searchParams.set(name, value);
		else url.searchParams.delete(name);
	}
	if (url.search === route.search) return;
	history.replaceState(null, "", url);
	route.search = url.search;
}

export function query(name: string): string | null {
	return new URLSearchParams(route.search).get(name);
}

window.addEventListener("popstate", () => {
	route.path = normalize(location.pathname);
	route.search = location.search;
});

document.addEventListener("click", (e) => {
	if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
	const a = (e.target as Element | null)?.closest?.("a");
	if (!a || a.target || a.hasAttribute("download") || a.getAttribute("rel")?.includes("external")) return;
	const href = a.getAttribute("href");
	if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
	const url = new URL(href, location.href);
	if (url.origin !== location.origin || url.pathname.startsWith("/files/") || url.pathname.startsWith("/api/")) return;
	e.preventDefault();
	navigate(url.pathname + url.search + url.hash);
});
