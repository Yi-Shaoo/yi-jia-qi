import { test, expect } from "./fixture";

test("连接失败可原地重试；退出失败不假报成功且提示不挡手机导航", async ({ page, app }) => {
	await app.docs("about");
	await page.route("**/api/me", route => route.fulfill({ status: 503, body: "unavailable" }));
	await page.goto("/about");
	await expect(page.getByRole("heading", { name: "暂时连不上小站" })).toBeVisible();
	await expect(page.getByLabel("我们的暗号")).toHaveCount(0);
	await page.unroute("**/api/me");
	await page.getByRole("button", { name: "重试连接" }).click();
	await expect(page.getByRole("heading", { name: "关于我们" })).toBeVisible();
	await page.route("**/api/logout", route => route.fulfill({ status: 503, body: "offline" }));
	await page.getByRole("button", { name: "账号菜单" }).click();
	await page.getByRole("menuitem", { name: "退出登录" }).click();
	const notice = page.locator('[data-sonner-toast]').filter({ hasText: "未能退出登录" });
	await expect(notice).toBeInViewport({ ratio: 1 });
	const bounds = (await notice.boundingBox())!;
	const nav = (await page.getByRole("navigation", { name: "主导航" }).boundingBox())!;
	expect(bounds.y).toBeGreaterThan(64);
	expect(bounds.y + bounds.height).toBeLessThanOrEqual(nav.y);
	await expect(page.getByRole("heading", { name: "关于我们" })).toBeVisible();
	await page.unroute("**/api/logout");
	await page.getByRole("button", { name: "账号菜单" }).click();
	await page.getByRole("menuitem", { name: "退出登录" }).click();
	await expect(page.getByLabel("我们的暗号")).toBeVisible();
});

for (const mode of ["light", "dark"]) {
	test(`${mode}：鼠标停在已选筛选项上仍保留选中态和可读对比度`, async ({ page, app }) => {
		await app.docs("photos");
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.addInitScript((theme) => localStorage.setItem("mode-watcher-mode", theme), mode);
		for (const [route, name] of [["/album", "海边"], ["/play", "走心"], ["/dates", "中间点"], ["/roadtrip", "周末"]]) {
			await page.goto(route);
			const radio = page.getByRole("radio", { name, exact: true });
			const chip = radio.locator("..").locator("span");
			await chip.click();
			await expect(radio).toBeChecked();
			await chip.hover();
			const values = await chip.evaluate((el) => {
				const style = getComputedStyle(el);
				function lum(s: string) {
					const c = s.match(/[\d.]+/g)!.slice(0, 3).map(x => Number(x) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
					return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
				}
				const a = lum(style.color), b = lum(style.backgroundColor);
				return { ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), bg: style.backgroundColor };
			});
			expect(values.ratio, route).toBeGreaterThanOrEqual(4.5);
			await page.mouse.move(0, 0);
			await expect(chip).toHaveCSS("background-color", values.bg);
		}
	});
}
