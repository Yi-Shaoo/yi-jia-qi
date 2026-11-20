import type { Component } from "svelte";
import BookOpen from "@lucide/svelte/icons/book-open";
import Car from "@lucide/svelte/icons/car";
import Clock from "@lucide/svelte/icons/clock";
import Gamepad2 from "@lucide/svelte/icons/gamepad-2";
import Gift from "@lucide/svelte/icons/gift";
import Heart from "@lucide/svelte/icons/heart";
import House from "@lucide/svelte/icons/house";
import Image from "@lucide/svelte/icons/image";
import MapPin from "@lucide/svelte/icons/map-pin";
import Star from "@lucide/svelte/icons/star";
import Users from "@lucide/svelte/icons/users";
import Utensils from "@lucide/svelte/icons/utensils";

export interface NavLink {
	href: string;
	label: string;
	desc?: string;
	icon: Component;
}
export interface NavGroup {
	key: string;
	label: string;
	icon: Component;
	links: NavLink[];
}

/** 原来一排 11 个入口，按用途收成 3 组 */
export const NAV_GROUPS: NavGroup[] = [
	{
		key: "us",
		label: "我们的",
		icon: Heart,
		links: [
			{ href: "/diary", label: "约会日记", desc: "两个人各写一边", icon: BookOpen },
			{ href: "/memories", label: "我们的回忆", desc: "按日期回看", icon: Clock },
			{ href: "/album", label: "情侣相册", desc: "按主题翻照片", icon: Image },
			{ href: "/about", label: "关于我们", desc: "记住彼此的喜好", icon: Users },
		],
	},
	{
		key: "play",
		label: "互动",
		icon: Gamepad2,
		links: [
			{ href: "/play", label: "一起玩", desc: "问答、小游戏和信箱", icon: Gamepad2 },
			{ href: "/wish", label: "心愿清单", desc: "勾选想一起做的事", icon: Star },
		],
	},
	{
		key: "out",
		label: "出去玩",
		icon: MapPin,
		links: [
			{ href: "/dates", label: "约会去哪", desc: "按地区找见面地点", icon: MapPin },
			{ href: "/food", label: "今天吃什么", desc: "找两边校园附近的餐厅", icon: Utensils },
			{ href: "/roadtrip", label: "Road-trip", desc: "按天数挑自驾路线", icon: Car },
			{ href: "/holiday", label: "感恩节和圣诞", desc: "查活动日期和出处", icon: Gift },
		],
	},
];

export const HOME_LINK = { href: "/", label: "首页", icon: House };

export function groupOf(path: string): string {
	if (path === "/") return "home";
	return NAV_GROUPS.find((g) => g.links.some((l) => l.href === path))?.key ?? "";
}
