/** 数据结构：和旧版网站保持一致，旧数据可以原样导入 */

export type Who = "yi" | "jq";

export const WHO: Record<Who, string> = { yi: "Yi", jq: "Jia Qi" };
export const otherOf = (w: Who): Who => (w === "yi" ? "jq" : "yi");

export interface Doc<T> {
	id: string;
	data: T;
	updated: number;
}

export type WishCat = "you" | "place" | "food";
export interface Wish {
	t: string;
	d: boolean;
	c: number;
	cat?: WishCat | "mine" | "";
	/** 「给对方的小心愿」是谁想要的 */
	from?: Who | "";
	/** 谁加的 */
	by?: Who | "";
}

export interface SharedMeta {
	/** 下次见面日期 YYYY-MM-DD */
	next?: string;
	/** 首页封面照片 id */
	hero?: string;
}

/** 约会地点：三张拍立得 + 攻略打勾 */
export interface SpotState {
	n: string;
	p: string[];
	d: number[];
	by?: Who | "";
	c?: number;
}

export interface CustomPlace {
	kind: "date" | "food";
	name: string;
	area: string;
	type: string;
	price?: string;
	desc: string;
	tip: string;
	q: string;
	c: number;
}

export type PhotoTag = "sea" | "trip" | "daily" | "";
export interface Photo {
	asset: string;
	cap: string;
	c: number;
	tag?: PhotoTag;
	/** 胶片日期戳，例如 '26 11 06 */
	st?: string;
}

export interface Memory {
	date: string;
	title: string;
	text: string;
	photos: string[];
	c: number;
}

export interface DiarySide {
	t: string;
	fav: string;
	photo: string;
	pl?: string;
}
export interface Diary {
	date: string;
	kind: "apart" | "together";
	title: string;
	place?: string;
	c: number;
	yi: DiarySide;
	jq: DiarySide;
}

export interface AboutItem {
	cat: string;
	who: Who;
	t: string;
	c: number;
}
export interface AboutCat {
	name: string;
	c: number;
}

export interface DailyAnswer {
	t: string;
	at: number;
}
export interface Daily {
	q: string;
	yi?: DailyAnswer;
	jq?: DailyAnswer;
}

export interface Stamp {
	t: string;
	c: number;
	who: Who;
	col: string;
}

export interface Miss {
	who: Who;
	n: number;
	note: string;
	c: number;
}

export interface Bottle {
	from: Who;
	t: string;
	c: number;
	picked: boolean;
	pickedAt?: number;
}

export interface Letter {
	from: Who;
	title: string;
	t: string;
	open: string;
	c: number;
	read: boolean;
}

export interface PetState {
	fedAt: number;
	fedBy: Who | "";
	pettedAt: number;
	pettedBy: Who | "";
	feeds: number;
}

export interface Collections {
	wishes: Wish;
	meta: SharedMeta;
	spots: SpotState;
	custom: CustomPlace;
	photos: Photo;
	memories: Memory;
	diary: Diary;
	about: AboutItem;
	aboutcats: AboutCat;
	daily: Daily;
	stamps: Stamp;
	miss: Miss;
	bottles: Bottle;
	letters: Letter;
	pet: PetState;
}
export type CollectionName = keyof Collections;
