import { expect, test } from "./fixture";

test("正确换号不消耗试错额度；达到错误上限后提示多久可重试", async ({ site, page }) => {
	const signIn = (password: string) => page.request.post("/api/login", { data: { password } });
	for (let i = 0; i < 12; i++) await expect(await signIn(i % 2 ? site.password : site.partner)).toBeOK();
	for (let i = 0; i < 9; i++) expect((await signIn("not-the-password")).status()).toBe(401);
	await expect(await signIn(site.password)).toBeOK();
	await page.request.post("/api/logout");
	await page.route(/^https:\/\/fonts\./, route => route.abort());
	await page.goto("/");
	const field = page.getByLabel("我们的暗号"), enter = page.getByRole("button", { name: "进门" });
	await field.fill("not-the-password");
	await enter.click();
	await expect(field).toHaveAttribute("aria-invalid", "true");
	await expect(page.getByRole("alert")).toHaveText("密码不对");
	await field.fill(site.password);
	const result = page.waitForResponse(r => r.url().endsWith("/api/login"));
	await enter.click();
	const response = await result;
	expect(response.status()).toBe(429);
	expect(Number(await response.headerValue("retry-after"))).toBeGreaterThan(0);
	await expect(field).toHaveAttribute("aria-invalid", "false");
	await expect(page.getByRole("alert")).toContainText("分钟后可重试");
	await expect(enter).toBeDisabled();
	await page.reload();
	await expect(page.getByRole("alert")).toContainText("分钟后可重试");
	await expect(field).toHaveAttribute("aria-invalid", "false");
});
