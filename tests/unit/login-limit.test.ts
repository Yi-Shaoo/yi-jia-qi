import { expect, test } from "bun:test";
import { loginCooldown, recordLoginFailure } from "../../server/auth";

test("只记录失败、按来源分开，固定窗口到期后恢复", () => {
	const ip = "limit-test";
	for (let i = 0; i < 9; i++) recordLoginFailure(ip, 10_000 + i);
	expect(loginCooldown(ip, 10_010)).toBe(0);
	recordLoginFailure(ip, 10_011);
	expect(loginCooldown(ip, 10_012)).toBe(600);
	expect(loginCooldown("other-test", 10_012)).toBe(0);
	expect(loginCooldown(ip, 609_999)).toBe(1);
	expect(loginCooldown(ip, 610_000)).toBe(0);
});
