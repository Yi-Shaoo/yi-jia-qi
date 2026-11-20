import type { Component } from "svelte";
import Gamepad2 from "@lucide/svelte/icons/gamepad-2";
import Heart from "@lucide/svelte/icons/heart";
import House from "@lucide/svelte/icons/house";
import MapPin from "@lucide/svelte/icons/map-pin";

export interface NavLink {
	href: string;
	label: string;
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
			{ href: "/diary", label: "约会日记" },
			{ href: "/memories", label: "我们的回忆" },
			{ href: "/album", label: "情侣相册" },
			{ href: "/about", label: "关于我们" },
		],
	},
	{
		key: "play",
		label: "互动",
		icon: Gamepad2,
		links: [
			{ href: "/play", label: "一起玩" },
			{ href: "/wish", label: "心愿清单" },
		],
	},
	{
		key: "out",
		label: "出去玩",
		icon: MapPin,
		links: [
			{ href: "/dates", label: "约会去哪" },
			{ href: "/food", label: "今天吃什么" },
			{ href: "/roadtrip", label: "Road-trip" },
			{ href: "/holiday", label: "感恩节和圣诞" },
		],
	},
];

export const HOME_LINK = { href: "/", label: "首页", icon: House };

export function groupOf(path: string): string {
	if (path === "/") return "home";
	return NAV_GROUPS.find((g) => g.links.some((l) => l.href === path))?.key ?? "";
}
