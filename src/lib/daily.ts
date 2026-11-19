import { DAILY_QUESTIONS } from "./data/content";

/** 每天轮换一道每日一问（和旧版同一套算法，所以同一天的问题不变） */
export function questionFor(key: string): string {
	const n = Math.round((new Date(`${key}T00:00:00`).getTime() - new Date("2026-01-01T00:00:00").getTime()) / 864e5);
	const L = DAILY_QUESTIONS.length;
	return DAILY_QUESTIONS[((n % L) + L) % L];
}
