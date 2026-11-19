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
	desc: string;
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
			{ href: "/diary", label: "约会日记", desc: "同一天，两扇窗", icon: BookOpen },
			{ href: "/memories", label: "我们的回忆", desc: "从认识那天到现在的每一站", icon: Clock },
			{ href: "/album", label: "情侣相册", desc: "两个人的照片都放在这里", icon: Image },
			{ href: "/about", label: "关于我们", desc: "我们各自喜欢的东西", icon: Users },
		],
	},
	{
		key: "play",
		label: "一起玩",
		icon: Gamepad2,
		links: [
			{ href: "/play", label: "一起玩", desc: "糯糯、每日一问、扭蛋机、漂流瓶…", icon: Gamepad2 },
			{ href: "/wish", label: "心愿清单", desc: "想做的事，做完一件勾一件", icon: Star },
		],
	},
	{
		key: "out",
		label: "出去玩",
		icon: MapPin,
		links: [
			{ href: "/dates", label: "约会去哪", desc: "Irvine、Westwood 和两人的中间点", icon: MapPin },
			{ href: "/food", label: "今天吃什么", desc: "拉面、烤肉、海边早午餐", icon: Utensils },
			{ href: "/roadtrip", label: "Road-trip", desc: "从一日游到长周末", icon: Car },
			{ href: "/holiday", label: "感恩节和圣诞", desc: "今年南加州的灯会和游船", icon: Gift },
		],
	},
];

export const HOME_LINK = { href: "/", label: "首页", icon: House };

export function groupOf(path: string): string {
	if (path === "/") return "home";
	return NAV_GROUPS.find((g) => g.links.some((l) => l.href === path))?.key ?? "";
}
