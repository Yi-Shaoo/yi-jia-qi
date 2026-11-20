import { expect, test } from "bun:test";
import { filterKey, matches } from "../../src/lib/components/places/search";
import { AREA } from "../../src/lib/data/content";

test("直链只采用当前列表提供的分类，未知值或原型键回退到全部", () => {
	const { far: _, ...food } = AREA;
	expect(filterKey("mid", food)).toBe("mid");
	expect(filterKey("far", AREA)).toBe("far");
	for (const key of ["far", "unknown", "toString", "__proto__", "", null]) expect(filterKey(key, food)).toBe("all");
});

test("搜索忽略大小写与多余空格，跨字段匹配全部关键词", () => {
	const query = "  BEAR   小木屋 & 湖 ";
	expect(matches(query, "Big Bear 小木屋", "森林 & 湖")).toBe(true);
	expect(matches(query, "Big Bear 小木屋", "森林")).toBe(false);
});
