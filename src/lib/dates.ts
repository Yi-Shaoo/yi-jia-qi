/** 日期小工具。日期统一用本地时间的 YYYY-MM-DD 字符串。 */

export const TOGETHER_SINCE = "2026-11-05";
export const MET_SINCE = "2026-10-11";
const DAY = 864e5;

export function keyOf(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayKey(): string {
	return keyOf(new Date());
}

export function addDays(n: number, from = new Date()): string {
	const d = new Date(from);
	d.setDate(d.getDate() + n);
	return keyOf(d);
}

function startOfToday() {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

/** 距离某天还有几天（今天 = 0，过去为负数） */
export function dayDiff(key: string): number {
	return Math.round((new Date(`${key}T00:00:00`).getTime() - startOfToday().getTime()) / DAY);
}

/** 从某天开始算的第几天（当天算第 1 天） */
export function dayCount(since: string): number {
	return -dayDiff(since) + 1;
}

const WEEK = "日一二三四五六";
export function weekday(key: string) {
	return `周${WEEK[new Date(`${key}T00:00:00`).getDay()]}`;
}

/** 11 月 19 日 · 星期四 */
export function fmtCN(key: string) {
	const d = new Date(`${key}T00:00:00`);
	return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${WEEK[d.getDay()]}`;
}

/** 2026 · 11 · 19 */
export function fmtDots(key: string) {
	const a = key.split("-");
	return a.length === 3 ? `${a[0]} · ${a[1]} · ${a[2]}` : "";
}

/** 11.19 */
export function fmtShort(key: string) {
	const a = key.split("-");
	return a.length === 3 ? `${Number(a[1])}.${Number(a[2])}` : "";
}

/** 胶片日期戳 '26 11 19 */
export function filmStamp(key: string) {
	const a = key.split("-");
	return a.length === 3 ? `'${a[0].slice(2)} ${a[1]} ${a[2]}` : "";
}

export function filmStampTs(ts: number) {
	return filmStamp(keyOf(new Date(ts)));
}

/** 11.19 08:30 */
export function fmtTime(ts: number, withDate = true) {
	const d = new Date(ts);
	const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
	return withDate ? `${d.getMonth() + 1}.${d.getDate()} ${hm}` : hm;
}

export function ago(ts: number) {
	if (!ts) return "还没有";
	const m = Math.round((Date.now() - ts) / 6e4);
	if (m < 1) return "刚刚";
	if (m < 60) return `${m} 分钟前`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h} 小时前`;
	return `${Math.round(h / 24)} 天前`;
}

export const isDateKey = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
