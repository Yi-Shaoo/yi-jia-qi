import { defineConfig, devices } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig(config, {
	workers: 1,
	grep: /下次见面：|日记：键盘|时光信箱：|待整理与正常时间线|回忆横图缩略图|手机新日记先写正文|回忆大图按本段顺序翻页|每日一问入口保留保存的题目|不同比例照片在同一位置连续翻页.*360px|外观默认跟随系统|缩略图不放大小图|390px 在长文底部|390px 地区筛选完整显示|390px 约会中间点第4张/,
	use: {
		...devices["iPhone 13"],
		browserName: "webkit",
		launchOptions: { executablePath: undefined },
	},
});
