// 从旧版网站迁移过来的静态内容（地点、餐厅、路线、节日、问题卡等）。
// 改内容直接改这个文件即可。

export type Area = "oc" | "la" | "mid" | "far";
export type RouteKind = "short" | "wk" | "long";
export type ArtIcon =
	| "wave" | "sun" | "house" | "tree" | "mtn" | "moon" | "wheel" | "boat" | "flower"
	| "art" | "cup" | "fish" | "castle" | "light" | "steps" | "star" | "heart";

export interface Spot { name: string; area: Area; type: string; desc: string; tip: string; q: string }
export interface FoodSpot extends Spot { price: string }
export interface Route { name: string; days: string; drive: string; season: string; stops: string[]; kind: RouteKind; q: string }
export interface HolidayEvent { when: string; name: string; desc: string }
export interface Holiday { date: string; title: string; sub: string; events: HolidayEvent[]; ideas: string[] }
export interface Guide { caps: { label: string; icon: ArtIcon }[]; steps: string[]; bring: string; eat: string }

export const AREA: Record<"all" | Area, string> = {
  "all": "全部",
  "oc": "Irvine / OC",
  "la": "Westwood / LA",
  "mid": "中间点",
  "far": "值得专程"
};

export const DATES: Spot[] = [
  {
    "name": "Crystal Cove 州立公园",
    "area": "oc",
    "type": "海滩",
    "desc": "退潮时看潮池，傍晚在海边小木屋区散步。",
    "tip": "下午四点后去，日落最好看",
    "q": "Crystal Cove State Park"
  },
  {
    "name": "Laguna Beach · Victoria Beach",
    "area": "oc",
    "type": "海滩",
    "desc": "沙滩上有一座小石塔，像童话里的城堡。",
    "tip": "低潮时才能走到塔边",
    "q": "Victoria Beach Laguna"
  },
  {
    "name": "Thousand Steps Beach",
    "area": "oc",
    "type": "海滩",
    "desc": "走两百多级台阶下去，人少、浪漂亮。",
    "tip": "穿好走的鞋",
    "q": "Thousand Steps Beach Laguna"
  },
  {
    "name": "Heisler Park",
    "area": "oc",
    "type": "散步",
    "desc": "Laguna 小镇旁的海崖步道，绿草地正对着海。",
    "tip": "顺路逛小镇画廊",
    "q": "Heisler Park Laguna Beach"
  },
  {
    "name": "Newport Back Bay 划皮划艇",
    "area": "oc",
    "type": "户外",
    "desc": "租一条双人皮划艇在湿地里慢慢划。",
    "tip": "早上风小",
    "q": "Newport Aquatic Center"
  },
  {
    "name": "Balboa Island 渡轮",
    "area": "oc",
    "type": "散步",
    "desc": "坐几分钟的小渡轮，上岛吃 Balboa Bar 冰淇淋。",
    "tip": "冬天晚上能看到家家户户的圣诞灯",
    "q": "Balboa Island Ferry"
  },
  {
    "name": "Doheny 州立海滩",
    "area": "oc",
    "type": "海滩",
    "desc": "Dana Point 的冲浪海滩，傍晚天会变成粉色。",
    "tip": "带野餐垫",
    "q": "Doheny State Beach"
  },
  {
    "name": "Irvine Spectrum 摩天轮",
    "area": "oc",
    "type": "城市",
    "desc": "离 UCI 最近的约会，吃完饭坐一圈摩天轮。",
    "tip": "平日晚上人少",
    "q": "Irvine Spectrum Center"
  },
  {
    "name": "Sherman 植物园",
    "area": "oc",
    "type": "展览",
    "desc": "Corona del Mar 的小花园，安静适合聊天。",
    "tip": "12 月有灯光夜",
    "q": "Sherman Library and Gardens"
  },
  {
    "name": "San Juan Capistrano 老教堂",
    "area": "oc",
    "type": "城市",
    "desc": "西班牙传教站的老花园和拱廊，很适合拍照。",
    "tip": "旁边就是火车站和老街",
    "q": "Mission San Juan Capistrano"
  },
  {
    "name": "Getty Center",
    "area": "la",
    "type": "展览",
    "desc": "免费入场的美术馆，花园和整个洛杉矶的景色。",
    "tip": "坐小电车上山，停车要付费",
    "q": "Getty Center"
  },
  {
    "name": "Griffith 天文台",
    "area": "la",
    "type": "夜景",
    "desc": "看洛杉矶夜景和好莱坞标志。",
    "tip": "周末停车难，早点去",
    "q": "Griffith Observatory"
  },
  {
    "name": "Santa Monica 码头",
    "area": "la",
    "type": "海滩",
    "desc": "摩天轮、海风、街头艺人。",
    "tip": "冬天有海边溜冰场",
    "q": "Santa Monica Pier"
  },
  {
    "name": "Venice 运河",
    "area": "la",
    "type": "散步",
    "desc": "小桥、小船和彩色房子，然后去 Abbot Kinney 逛街。",
    "tip": "适合拍照",
    "q": "Venice Canals"
  },
  {
    "name": "El Matador 海滩",
    "area": "la",
    "type": "海滩",
    "desc": "Malibu 的礁石拱门，日落时很梦幻。",
    "tip": "下去的路有点陡",
    "q": "El Matador State Beach"
  },
  {
    "name": "Topanga 徒步",
    "area": "la",
    "type": "户外",
    "desc": "离 Westwood 很近的山路，能看到海。",
    "tip": "带水，中午别去",
    "q": "Topanga State Park"
  },
  {
    "name": "The Broad",
    "area": "la",
    "type": "展览",
    "desc": "当代艺术馆，免费常设展，草间弥生的无限镜屋要另外预约。",
    "tip": "提前在官网约时段",
    "q": "The Broad Los Angeles"
  },
  {
    "name": "The Huntington 花园",
    "area": "la",
    "type": "展览",
    "desc": "日本园、中国园和沙漠园，一逛就是半天。",
    "tip": "需要提前买票",
    "q": "The Huntington Library Pasadena"
  },
  {
    "name": "UCLA 校园约会",
    "area": "la",
    "type": "城市",
    "desc": "Royce Hall 前的草坪、Sculpture Garden，然后去 Westwood 吃饭。",
    "tip": "他带你逛他的学校",
    "q": "Royce Hall UCLA"
  },
  {
    "name": "Hollywood Bowl",
    "area": "la",
    "type": "夜景",
    "desc": "露天音乐会，自带野餐进场。",
    "tip": "夏季演出季",
    "q": "Hollywood Bowl"
  },
  {
    "name": "Point Vicente 灯塔",
    "area": "mid",
    "type": "海滩",
    "desc": "Palos Verdes 悬崖上的灯塔，冬天有时能看到灰鲸。",
    "tip": "12 月到 4 月是观鲸季",
    "q": "Point Vicente Interpretive Center"
  },
  {
    "name": "Terranea 海边日落",
    "area": "mid",
    "type": "夜景",
    "desc": "度假村的海崖步道对外开放，日落很美。",
    "tip": "在海边酒吧喝一杯",
    "q": "Terranea Resort"
  },
  {
    "name": "Naples 岛贡多拉",
    "area": "mid",
    "type": "散步",
    "desc": "Long Beach 的运河小岛，可以坐意大利小船。",
    "tip": "冬天有圣诞灯",
    "q": "Gondola Getaway Long Beach"
  },
  {
    "name": "太平洋水族馆",
    "area": "mid",
    "type": "展览",
    "desc": "看海狮、水母和企鹅。",
    "tip": "买票前看有没有晚场",
    "q": "Aquarium of the Pacific"
  },
  {
    "name": "Queen Mary 邮轮",
    "area": "mid",
    "type": "城市",
    "desc": "停在港口的老邮轮，可以上去参观。",
    "tip": "晚上看港口夜景",
    "q": "Queen Mary Long Beach"
  },
  {
    "name": "South Coast 植物园",
    "area": "mid",
    "type": "展览",
    "desc": "Palos Verdes 的大植物园，节日期间有灯光夜。",
    "tip": "适合慢慢散步",
    "q": "South Coast Botanic Garden"
  },
  {
    "name": "Mitsuwa Torrance",
    "area": "mid",
    "type": "城市",
    "desc": "日本超市加美食广场，可以买零食回去。",
    "tip": "两个人的“日本一日游”",
    "q": "Mitsuwa Marketplace Torrance"
  },
  {
    "name": "Belmont Shore 散步",
    "area": "mid",
    "type": "散步",
    "desc": "Long Beach 海边的小街，咖啡馆很多。",
    "tip": "日落后去海边走走",
    "q": "Belmont Shore Long Beach"
  },
  {
    "name": "卡特琳娜岛再去一次",
    "area": "far",
    "type": "户外",
    "desc": "这次可以试试浮潜或者坐玻璃底船。",
    "tip": "从 Long Beach 或 Dana Point 上船",
    "q": "Catalina Island"
  },
  {
    "name": "Joshua Tree 星空夜",
    "area": "far",
    "type": "户外",
    "desc": "上次是白天，这次留到晚上看银河。",
    "tip": "挑没有月亮的晚上",
    "q": "Joshua Tree National Park"
  },
  {
    "name": "Disneyland 烟火夜",
    "area": "far",
    "type": "城市",
    "desc": "在城堡前一起看烟火。",
    "tip": "节日期间有圣诞装饰",
    "q": "Disneyland Resort"
  },
  {
    "name": "环球影城再去一次",
    "area": "far",
    "type": "城市",
    "desc": "节日期间有圣诞装饰和《鬼灵精》村庄。",
    "tip": "这次去哈利波特区喝黄油啤酒",
    "q": "Universal Studios Hollywood"
  }
];

export const FOOD: FoodSpot[] = [
  {
    "name": "Din Tai Fung 鼎泰丰",
    "area": "oc",
    "type": "中餐",
    "price": "$$",
    "desc": "South Coast Plaza 店，小笼包和虾仁炒饭。",
    "tip": "饭点要等位，提前在网上排号",
    "q": "Din Tai Fung South Coast Plaza"
  },
  {
    "name": "Paradise Dynasty 乐天皇朝",
    "area": "oc",
    "type": "中餐",
    "price": "$$",
    "desc": "八色小笼包，一笼八个口味。",
    "tip": "和鼎泰丰在同一个商场",
    "q": "Paradise Dynasty Costa Mesa"
  },
  {
    "name": "Diamond Jamboree",
    "area": "oc",
    "type": "亚洲小吃",
    "price": "$",
    "desc": "Irvine 的亚洲美食广场，奶茶、韩餐、粤菜都有。",
    "tip": "适合不知道吃什么的时候",
    "q": "Diamond Jamboree Irvine"
  },
  {
    "name": "Taco María",
    "area": "oc",
    "type": "墨西哥",
    "price": "$$$$",
    "desc": "米其林一星的现代墨西哥菜，适合纪念日。",
    "tip": "一定要订位",
    "q": "Taco Maria Costa Mesa"
  },
  {
    "name": "Water Grill",
    "area": "oc",
    "type": "海鲜",
    "price": "$$$",
    "desc": "生蚝和海鲜拼盘，环境正式一点。",
    "tip": "适合庆祝",
    "q": "Water Grill Costa Mesa"
  },
  {
    "name": "The Beachcomber",
    "area": "oc",
    "type": "海边早午餐",
    "price": "$$$",
    "desc": "就在 Crystal Cove 沙滩上吃饭。",
    "tip": "早上去，景色最好",
    "q": "Beachcomber Crystal Cove"
  },
  {
    "name": "Crystal Cove Shake Shack",
    "area": "oc",
    "type": "甜品",
    "price": "$",
    "desc": "悬崖上的小奶昔店，配海景。",
    "tip": "点枣子奶昔",
    "q": "Crystal Cove Shake Shack"
  },
  {
    "name": "Mitsuwa Costa Mesa",
    "area": "oc",
    "type": "日料",
    "price": "$",
    "desc": "超市里的美食广场，拉面和天妇罗盖饭。",
    "tip": "吃完逛超市",
    "q": "Mitsuwa Costa Mesa"
  },
  {
    "name": "Cream Pan",
    "area": "oc",
    "type": "面包",
    "price": "$",
    "desc": "Tustin 的日式面包店，招牌是草莓可颂。",
    "tip": "早点去，容易卖完",
    "q": "Cream Pan Tustin"
  },
  {
    "name": "Tsujita LA",
    "area": "la",
    "type": "日料",
    "price": "$$",
    "desc": "Sawtelle 的沾面，汤头浓。",
    "tip": "在 Westwood 隔壁",
    "q": "Tsujita LA Artisan Noodle"
  },
  {
    "name": "Sawtelle 日本城",
    "area": "la",
    "type": "日料",
    "price": "$$",
    "desc": "一条街的拉面、甜品和咖啡。",
    "tip": "吃完散步消食",
    "q": "Sawtelle Japantown"
  },
  {
    "name": "Diddy Riese",
    "area": "la",
    "type": "甜品",
    "price": "$",
    "desc": "Westwood 的平价冰淇淋夹心饼干，UCLA 学生的最爱。",
    "tip": "现金更快",
    "q": "Diddy Riese Westwood"
  },
  {
    "name": "Marugame Monzo",
    "area": "la",
    "type": "日料",
    "price": "$$",
    "desc": "Little Tokyo 的手打乌冬，明太子奶油乌冬很有名。",
    "tip": "要排队",
    "q": "Marugame Monzo"
  },
  {
    "name": "Republique",
    "area": "la",
    "type": "早午餐",
    "price": "$$$",
    "desc": "老教堂改的法式餐厅，早上卖面包和早午餐。",
    "tip": "周末很多人",
    "q": "Republique Los Angeles"
  },
  {
    "name": "Gjusta",
    "area": "la",
    "type": "面包",
    "price": "$$",
    "desc": "Venice 的面包店和熟食，买了去海边吃。",
    "tip": "搭配 Venice 运河",
    "q": "Gjusta Venice"
  },
  {
    "name": "Grand Central Market",
    "area": "la",
    "type": "小吃",
    "price": "$",
    "desc": "DTLA 百年老市场，每人挑一家店。",
    "tip": "搭配 The Broad",
    "q": "Grand Central Market"
  },
  {
    "name": "Howlin' Ray's",
    "area": "la",
    "type": "美式",
    "price": "$",
    "desc": "Nashville 辣鸡，辣度可以选。",
    "tip": "排队很长，早点到",
    "q": "Howlin Rays Chinatown"
  },
  {
    "name": "Park's BBQ",
    "area": "la",
    "type": "韩餐",
    "price": "$$$",
    "desc": "Koreatown 的韩式烤肉，肉质很好。",
    "tip": "适合庆祝",
    "q": "Park's BBQ Koreatown"
  },
  {
    "name": "Bavel",
    "area": "la",
    "type": "中东",
    "price": "$$$",
    "desc": "DTLA 的中东菜，面包和烤肉都很好吃。",
    "tip": "要提前订位",
    "q": "Bavel Los Angeles"
  },
  {
    "name": "Sugarfish",
    "area": "la",
    "type": "日料",
    "price": "$$",
    "desc": "套餐式寿司，不用纠结点什么。",
    "tip": "点 Trust Me 套餐",
    "q": "Sugarfish Brentwood"
  },
  {
    "name": "Torihei",
    "area": "mid",
    "type": "日料",
    "price": "$$",
    "desc": "Torrance 的关东煮和串烧居酒屋。",
    "tip": "适合晚上小酌",
    "q": "Torihei Torrance"
  },
  {
    "name": "Musha",
    "area": "mid",
    "type": "日料",
    "price": "$$",
    "desc": "热闹的日式居酒屋，菜很有创意。",
    "tip": "两人点几道分着吃",
    "q": "Musha Torrance"
  },
  {
    "name": "Mitsuwa Torrance",
    "area": "mid",
    "type": "日料",
    "price": "$",
    "desc": "中间点的日本超市美食广场。",
    "tip": "约在这里见面最方便",
    "q": "Mitsuwa Marketplace Torrance"
  },
  {
    "name": "Naples Rib Company",
    "area": "mid",
    "type": "美式",
    "price": "$$",
    "desc": "Long Beach 的烤肋排。",
    "tip": "吃完去 Naples 岛散步",
    "q": "Naples Rib Company Long Beach"
  }
];

export const ROAD: Route[] = [
  {
    "name": "1 号公路 Malibu → Santa Barbara",
    "days": "1–2 天",
    "drive": "约 2 小时",
    "season": "全年",
    "stops": [
      "El Matador 海滩看礁石",
      "Ventura 码头吃海鲜",
      "Santa Barbara 老城和 Stearns Wharf"
    ],
    "kind": "short",
    "q": "PCH Malibu to Santa Barbara"
  },
  {
    "name": "San Diego + La Jolla",
    "days": "1–2 天",
    "drive": "Irvine 约 1.5 小时",
    "season": "全年",
    "stops": [
      "La Jolla Cove 看海狮",
      "Balboa Park 散步",
      "Little Italy 吃晚饭"
    ],
    "kind": "short",
    "q": "La Jolla Cove"
  },
  {
    "name": "Temecula 酒庄一日游",
    "days": "1 天",
    "drive": "Irvine 约 1 小时",
    "season": "秋冬",
    "stops": [
      "酒庄品酒（要有人负责开车）",
      "Old Town Temecula 老街",
      "热气球（需提前预约）"
    ],
    "kind": "short",
    "q": "Old Town Temecula"
  },
  {
    "name": "Ojai 小镇",
    "days": "1 天",
    "drive": "约 1.5 小时",
    "season": "全年",
    "stops": [
      "Bart's Books 露天书店",
      "日落时的 Pink Moment",
      "Meditation Mount 看山谷"
    ],
    "kind": "short",
    "q": "Ojai California"
  },
  {
    "name": "Solvang 丹麦小镇",
    "days": "1–2 天",
    "drive": "约 2.5 小时",
    "season": "冬天有圣诞市集",
    "stops": [
      "丹麦小镇和风车",
      "Los Olivos 品酒",
      "回程停 Santa Barbara"
    ],
    "kind": "short",
    "q": "Solvang California"
  },
  {
    "name": "Palm Springs + Joshua Tree",
    "days": "2 天",
    "drive": "约 2 小时",
    "season": "秋冬春",
    "stops": [
      "Palm Springs 空中缆车上山",
      "中世纪现代风格街区拍照",
      "晚上去 Joshua Tree 看星星"
    ],
    "kind": "wk",
    "q": "Palm Springs Aerial Tramway"
  },
  {
    "name": "Big Bear 小木屋",
    "days": "2 天",
    "drive": "约 2 小时",
    "season": "冬天看雪",
    "stops": [
      "湖边小木屋",
      "Snow Summit 滑雪",
      "Big Bear Village 吃早午餐"
    ],
    "kind": "wk",
    "q": "Big Bear Lake"
  },
  {
    "name": "Anza-Borrego 沙漠",
    "days": "2 天",
    "drive": "Irvine 约 2 小时",
    "season": "2–3 月花季",
    "stops": [
      "沙漠里的金属恐龙雕塑",
      "Palm Canyon 徒步",
      "暗夜保护区看星空"
    ],
    "kind": "wk",
    "q": "Anza-Borrego Desert State Park"
  },
  {
    "name": "Death Valley 死亡谷",
    "days": "2–3 天",
    "drive": "约 4.5 小时",
    "season": "11–3 月",
    "stops": [
      "Zabriskie Point 看日出",
      "Badwater 盐滩",
      "Mesquite 沙丘看日落"
    ],
    "kind": "long",
    "q": "Death Valley National Park"
  },
  {
    "name": "Sequoia 红杉林",
    "days": "2–3 天",
    "drive": "约 4 小时",
    "season": "春夏秋",
    "stops": [
      "谢尔曼将军树",
      "Moro Rock 登顶",
      "Crescent Meadow 野餐"
    ],
    "kind": "long",
    "q": "Sequoia National Park"
  },
  {
    "name": "Big Sur 海岸线",
    "days": "3 天",
    "drive": "约 5 小时",
    "season": "春秋",
    "stops": [
      "Bixby Bridge",
      "McWay 瀑布",
      "Carmel 小镇"
    ],
    "kind": "long",
    "q": "Bixby Creek Bridge"
  },
  {
    "name": "Mammoth Lakes",
    "days": "3 天",
    "drive": "约 5 小时",
    "season": "冬天滑雪",
    "stops": [
      "Mammoth Mountain 滑雪",
      "温泉",
      "395 号公路沿途风景"
    ],
    "kind": "long",
    "q": "Mammoth Lakes"
  }
];

export const THANKS: Holiday = {
  "date": "2026-11-26",
  "title": "感恩节",
  "sub": "11 月 26 日 · 星期四",
  "events": [
    {
      "when": "11.26",
      "name": "LA Turkey Trot",
      "desc": "DTLA 的感恩节早晨跑步，跑完回去吃大餐。"
    },
    {
      "when": "11.27–28",
      "name": "《小鬼当家》音乐会",
      "desc": "Walt Disney Concert Hall 现场乐团配电影放映。11.28–29 还有《圣诞精灵》。"
    },
    {
      "when": "11.27",
      "name": "Lighting of the Bay",
      "desc": "Newport Dunes 的点灯仪式和烟火。"
    },
    {
      "when": "11.27 起",
      "name": "L.A. LIVE 溜冰场",
      "desc": "DTLA 的露天节日溜冰场，开到 1 月 3 日。"
    },
    {
      "when": "11.29",
      "name": "Hollywood 圣诞游行",
      "desc": "好莱坞大道上的花车游行。"
    }
  ],
  "ideas": [
    "两个人的 Friendsgiving：分工做一桌小感恩节晚餐",
    "各写 10 件感谢对方的事，吃饭时轮流念",
    "一起做南瓜派，异地就视频同步做",
    "Black Friday 一起去 South Coast Plaza 逛街",
    "看一部感恩节电影，然后计划圣诞节"
  ]
};

export const XMAS: Holiday = {
  "date": "2026-12-25",
  "title": "圣诞节",
  "sub": "12 月 25 日 · 星期五",
  "events": [
    {
      "when": "11.20–1.10",
      "name": "LA Zoo Lights",
      "desc": "洛杉矶动物园的夜间灯会。"
    },
    {
      "when": "11.22–1.9",
      "name": "Descanso 光之森林",
      "desc": "La Cañada 的植物园灯光步道，非常浪漫。"
    },
    {
      "when": "11.18–1.3",
      "name": "Santa Monica 瑞士冬日村",
      "desc": "码头上的圣诞市集和海边溜冰场。"
    },
    {
      "when": "11.21–1.3",
      "name": "环球影城节日季",
      "desc": "你们去过的地方，这次是圣诞版。"
    },
    {
      "when": "11.13–1.3",
      "name": "South Coast 植物园灯光夜",
      "desc": "中间点的灯会，两个人都方便。"
    },
    {
      "when": "12.3–17",
      "name": "Sherman 植物园灯光夜",
      "desc": "Corona del Mar 的小花园灯光。"
    },
    {
      "when": "12.5",
      "name": "Crystal Cove 圣诞点灯",
      "desc": "海边小木屋的点灯和节日集市。"
    },
    {
      "when": "12.6",
      "name": "Corona del Mar 圣诞散步",
      "desc": "街上有音乐、小吃和装饰。"
    },
    {
      "when": "12.16–20",
      "name": "Newport 圣诞游船巡游",
      "desc": "百年传统的海湾灯光船队，可以订游船从水上看。"
    }
  ],
  "ideas": [
    "交换礼物：定一个预算，再加一张手写卡片",
    "一起做姜饼屋",
    "穿丑圣诞毛衣拍一张合照",
    "圣诞电影马拉松：《真爱至上》《恋爱假期》《克劳斯：圣诞节的秘密》",
    "Balboa Island 走一圈，看家家户户的圣诞灯"
  ]
};

export const GUIDE: Record<string, Guide> = {
  "Crystal Cove 州立公园": {
    "caps": [
      {
        "label": "潮池",
        "icon": "wave"
      },
      {
        "label": "小木屋",
        "icon": "house"
      },
      {
        "label": "日落",
        "icon": "sun"
      }
    ],
    "steps": [
      "四点左右到，停 Los Trancos 停车场",
      "穿过海边隧道，到老小木屋区",
      "退潮时去礁石边找海星和小螃蟹",
      "坐在沙滩上等日落"
    ],
    "bring": "防滑鞋、薄外套",
    "eat": "Beachcomber Café 就在沙滩上"
  },
  "Laguna Beach · Victoria Beach": {
    "caps": [
      {
        "label": "石塔",
        "icon": "castle"
      },
      {
        "label": "礁石",
        "icon": "wave"
      },
      {
        "label": "海浪",
        "icon": "wave"
      }
    ],
    "steps": [
      "先查好潮汐表，挑低潮时间去",
      "住宅区路边停车，从小台阶走下沙滩",
      "沿沙滩走到童话小石塔拍照",
      "旁边礁石间有一个天然小水池"
    ],
    "bring": "拖鞋或凉鞋、毛巾",
    "eat": "回 Laguna 小镇吃饭"
  },
  "Thousand Steps Beach": {
    "caps": [
      {
        "label": "台阶",
        "icon": "steps"
      },
      {
        "label": "海浪",
        "icon": "wave"
      },
      {
        "label": "礁石",
        "icon": "wave"
      }
    ],
    "steps": [
      "在 9th Ave 附近的 PCH 路边停车",
      "沿两百多级台阶走下去",
      "低潮时去南边礁石看小洞穴",
      "爬回去前先坐着歇一会儿"
    ],
    "bring": "好走的鞋、水",
    "eat": "回 Laguna 小镇吃点心"
  },
  "Heisler Park": {
    "caps": [
      {
        "label": "海崖",
        "icon": "wave"
      },
      {
        "label": "花园",
        "icon": "flower"
      },
      {
        "label": "画廊",
        "icon": "art"
      }
    ],
    "steps": [
      "停在 Laguna 市中心，或坐免费小巴",
      "沿海崖步道慢慢走",
      "下到 Picnic Beach 看潮池",
      "回 Forest Ave 逛小画廊"
    ],
    "bring": "相机、野餐垫",
    "eat": "小镇上随便挑一家咖啡馆"
  },
  "Newport Back Bay 划皮划艇": {
    "caps": [
      {
        "label": "皮划艇",
        "icon": "boat"
      },
      {
        "label": "湿地",
        "icon": "tree"
      },
      {
        "label": "水鸟",
        "icon": "sun"
      }
    ],
    "steps": [
      "早上风小的时候去",
      "在 Newport Aquatic Center 租双人皮划艇",
      "沿湿地慢慢划，看水鸟",
      "划完在 Back Bay 步道散散步"
    ],
    "bring": "防晒、帽子、能湿的衣服",
    "eat": "Newport 海边吃早午餐"
  },
  "Balboa Island 渡轮": {
    "caps": [
      {
        "label": "渡轮",
        "icon": "boat"
      },
      {
        "label": "冰淇淋",
        "icon": "cup"
      },
      {
        "label": "小岛",
        "icon": "house"
      }
    ],
    "steps": [
      "停在 Balboa 半岛 Fun Zone 附近",
      "坐几分钟小渡轮上岛",
      "Marine Ave 上买 Balboa Bar 冰淇淋",
      "沿岛边小路绕一圈看房子"
    ],
    "bring": "外套（海风大）",
    "eat": "冰淇淋 + Marine Ave 小店"
  },
  "Doheny 州立海滩": {
    "caps": [
      {
        "label": "冲浪",
        "icon": "wave"
      },
      {
        "label": "野餐",
        "icon": "heart"
      },
      {
        "label": "粉色天空",
        "icon": "sun"
      }
    ],
    "steps": [
      "下午到，挑一块草地铺野餐垫",
      "看冲浪的人练习",
      "11.6 你们来过 BBQ，这次可以早点占位",
      "等天空变成粉色再走"
    ],
    "bring": "野餐垫、零食、外套",
    "eat": "Dana Point 港口吃海鲜"
  },
  "Irvine Spectrum 摩天轮": {
    "caps": [
      {
        "label": "摩天轮",
        "icon": "wheel"
      },
      {
        "label": "晚饭",
        "icon": "cup"
      },
      {
        "label": "夜灯",
        "icon": "star"
      }
    ],
    "steps": [
      "平日傍晚去，人少",
      "先在 Spectrum 里吃晚饭",
      "天黑后坐一圈摩天轮",
      "逛一逛小店再回去"
    ],
    "bring": "没什么要带的",
    "eat": "Spectrum 里的餐厅都可以"
  },
  "Sherman 植物园": {
    "caps": [
      {
        "label": "花园",
        "icon": "flower"
      },
      {
        "label": "温室",
        "icon": "tree"
      },
      {
        "label": "下午茶",
        "icon": "cup"
      }
    ],
    "steps": [
      "挑天气好的下午去",
      "在小花园里慢慢逛",
      "看温室里的热带植物",
      "在园里的小咖啡馆坐一会儿"
    ],
    "bring": "相机",
    "eat": "园内咖啡馆，或附近 Corona del Mar 小店"
  },
  "San Juan Capistrano 老教堂": {
    "caps": [
      {
        "label": "拱廊",
        "icon": "castle"
      },
      {
        "label": "花园",
        "icon": "flower"
      },
      {
        "label": "火车站",
        "icon": "house"
      }
    ],
    "steps": [
      "上午去，光线柔和",
      "逛传教站的花园和老石头教堂遗址",
      "走去旁边的 Los Rios 老街",
      "在火车站边看火车经过"
    ],
    "bring": "相机、帽子",
    "eat": "Los Rios 老街上的小茶屋"
  },
  "Getty Center": {
    "caps": [
      {
        "label": "美术馆",
        "icon": "art"
      },
      {
        "label": "花园",
        "icon": "flower"
      },
      {
        "label": "远景",
        "icon": "sun"
      }
    ],
    "steps": [
      "中午后去，开车停在山脚停车场",
      "坐白色小电车上山",
      "看梵高的《鸢尾花》和中央花园",
      "留到日落看整个洛杉矶"
    ],
    "bring": "外套（山上风大）",
    "eat": "山上的咖啡厅和餐厅"
  },
  "Griffith 天文台": {
    "caps": [
      {
        "label": "天文台",
        "icon": "castle"
      },
      {
        "label": "夜景",
        "icon": "star"
      },
      {
        "label": "月亮",
        "icon": "moon"
      }
    ],
    "steps": [
      "傍晚前到，周末停车更难",
      "先看天象厅的星空表演",
      "晴天晚上用门口免费的望远镜看星星",
      "在露台看洛杉矶夜景"
    ],
    "bring": "外套、手电筒",
    "eat": "去 Los Feliz 吃晚饭"
  },
  "Santa Monica 码头": {
    "caps": [
      {
        "label": "摩天轮",
        "icon": "wheel"
      },
      {
        "label": "海边",
        "icon": "wave"
      },
      {
        "label": "日落",
        "icon": "sun"
      }
    ],
    "steps": [
      "下午到，先在码头上逛",
      "坐一圈海边摩天轮",
      "租自行车沿海边骑到 Venice",
      "日落时回码头看海"
    ],
    "bring": "外套、防晒",
    "eat": "Third Street Promenade 吃晚饭"
  },
  "Venice 运河": {
    "caps": [
      {
        "label": "小桥",
        "icon": "house"
      },
      {
        "label": "小船",
        "icon": "boat"
      },
      {
        "label": "彩色房子",
        "icon": "flower"
      }
    ],
    "steps": [
      "停在 Venice 海边停车场",
      "在运河小桥之间慢慢走、拍照",
      "去 Abbot Kinney 逛街",
      "傍晚去 Venice 海滩看日落"
    ],
    "bring": "相机、舒服的鞋",
    "eat": "Gjusta 买面包去海边吃"
  },
  "El Matador 海滩": {
    "caps": [
      {
        "label": "拱门",
        "icon": "castle"
      },
      {
        "label": "礁石",
        "icon": "wave"
      },
      {
        "label": "日落",
        "icon": "sun"
      }
    ],
    "steps": [
      "日落前一个半小时到，停车位很少",
      "沿陡坡和台阶下到海滩",
      "低潮时穿过礁石拱门拍照",
      "看完日落趁天没黑上去"
    ],
    "bring": "好走的鞋、外套",
    "eat": "回程吃 Malibu 海边的海鲜小店"
  },
  "Topanga 徒步": {
    "caps": [
      {
        "label": "山路",
        "icon": "mtn"
      },
      {
        "label": "大石头",
        "icon": "mtn"
      },
      {
        "label": "海景",
        "icon": "wave"
      }
    ],
    "steps": [
      "上午去，中午太晒",
      "从 Trippet Ranch 停车场出发",
      "走到 Eagle Rock 大石头上看风景",
      "下山后在 Topanga 小镇转转"
    ],
    "bring": "水、帽子、防晒、运动鞋",
    "eat": "Topanga 小镇上的咖啡馆"
  },
  "The Broad": {
    "caps": [
      {
        "label": "美术馆",
        "icon": "art"
      },
      {
        "label": "镜屋",
        "icon": "star"
      },
      {
        "label": "音乐厅",
        "icon": "castle"
      }
    ],
    "steps": [
      "提前在官网约好入场时段",
      "常设展免费，镜屋要另外预约",
      "去旁边迪士尼音乐厅的屋顶花园走走",
      "走路去 Grand Central Market 吃饭"
    ],
    "bring": "没什么要带的",
    "eat": "Grand Central Market"
  },
  "The Huntington 花园": {
    "caps": [
      {
        "label": "日本园",
        "icon": "flower"
      },
      {
        "label": "流芳园",
        "icon": "house"
      },
      {
        "label": "沙漠园",
        "icon": "tree"
      }
    ],
    "steps": [
      "提前在官网买票",
      "先逛日本园和中国园流芳园",
      "再去沙漠园看仙人掌",
      "累了在玫瑰园旁边歇一会儿"
    ],
    "bring": "舒服的鞋、水",
    "eat": "园内餐厅，或 Pasadena 老城"
  },
  "UCLA 校园约会": {
    "caps": [
      {
        "label": "Royce Hall",
        "icon": "castle"
      },
      {
        "label": "雕塑园",
        "icon": "art"
      },
      {
        "label": "Westwood",
        "icon": "cup"
      }
    ],
    "steps": [
      "让 Jia Qi 带你走一圈校园",
      "在 Royce Hall 前的草坪坐一会儿",
      "逛 Sculpture Garden",
      "走去 Westwood 吃饭"
    ],
    "bring": "没什么要带的",
    "eat": "Diddy Riese 冰淇淋饼干"
  },
  "Hollywood Bowl": {
    "caps": [
      {
        "label": "露天舞台",
        "icon": "star"
      },
      {
        "label": "野餐",
        "icon": "heart"
      },
      {
        "label": "夜晚",
        "icon": "moon"
      }
    ],
    "steps": [
      "先在官网看演出季和节目单",
      "坐 Park & Ride 大巴，不用找车位",
      "提前进场在野餐区吃东西",
      "在星空下听音乐会"
    ],
    "bring": "野餐、毯子、外套",
    "eat": "自己带野餐"
  },
  "Point Vicente 灯塔": {
    "caps": [
      {
        "label": "灯塔",
        "icon": "light"
      },
      {
        "label": "鲸鱼",
        "icon": "fish"
      },
      {
        "label": "悬崖",
        "icon": "wave"
      }
    ],
    "steps": [
      "12 月到 4 月是观鲸季",
      "先去小展览馆看鲸鱼介绍",
      "沿悬崖步道找海面上的喷水",
      "顺路去 Terranea 看日落"
    ],
    "bring": "望远镜、外套",
    "eat": "附近 Terranea 的海边酒吧"
  },
  "Terranea 海边日落": {
    "caps": [
      {
        "label": "海崖",
        "icon": "wave"
      },
      {
        "label": "日落",
        "icon": "sun"
      },
      {
        "label": "酒吧",
        "icon": "cup"
      }
    ],
    "steps": [
      "日落前一小时到",
      "沿度假村的海崖步道散步",
      "下到小海湾看潮池",
      "在悬崖边的 Nelson's 喝一杯"
    ],
    "bring": "外套",
    "eat": "Nelson's 海边小酒吧"
  },
  "Naples 岛贡多拉": {
    "caps": [
      {
        "label": "贡多拉",
        "icon": "boat"
      },
      {
        "label": "运河",
        "icon": "wave"
      },
      {
        "label": "圣诞灯",
        "icon": "star"
      }
    ],
    "steps": [
      "提前在官网订好小船",
      "傍晚坐贡多拉绕运河一圈",
      "下船后在 Naples 小岛走一走",
      "12 月看家家户户的圣诞灯"
    ],
    "bring": "外套",
    "eat": "Belmont Shore 2nd Street"
  },
  "太平洋水族馆": {
    "caps": [
      {
        "label": "水母",
        "icon": "fish"
      },
      {
        "label": "企鹅",
        "icon": "heart"
      },
      {
        "label": "海狮",
        "icon": "fish"
      }
    ],
    "steps": [
      "买票前看有没有晚间活动",
      "先看水母和企鹅",
      "去户外看海狮",
      "出来后在 Rainbow Harbor 海边散步"
    ],
    "bring": "没什么要带的",
    "eat": "Shoreline Village 海边小店"
  },
  "Queen Mary 邮轮": {
    "caps": [
      {
        "label": "邮轮",
        "icon": "boat"
      },
      {
        "label": "港口",
        "icon": "wave"
      },
      {
        "label": "夜景",
        "icon": "star"
      }
    ],
    "steps": [
      "下午去，先在船上参观",
      "看老船舱和甲板",
      "在甲板上看 Long Beach 天际线",
      "留到晚上看港口夜景"
    ],
    "bring": "外套",
    "eat": "船上餐厅，或回 Long Beach 市区"
  },
  "South Coast 植物园": {
    "caps": [
      {
        "label": "花园",
        "icon": "flower"
      },
      {
        "label": "湖",
        "icon": "wave"
      },
      {
        "label": "步道",
        "icon": "tree"
      }
    ],
    "steps": [
      "挑一个不太热的下午",
      "沿环形步道慢慢走",
      "在小湖边坐一会儿",
      "节日期间来看灯光夜"
    ],
    "bring": "帽子、水",
    "eat": "附近 Torrance 吃日料"
  },
  "Mitsuwa Torrance": {
    "caps": [
      {
        "label": "超市",
        "icon": "house"
      },
      {
        "label": "美食广场",
        "icon": "cup"
      },
      {
        "label": "零食",
        "icon": "heart"
      }
    ],
    "steps": [
      "饭点前到，美食广场人会多",
      "每人挑一样吃的分着吃",
      "逛超市买日本零食",
      "买一份带回去当夜宵"
    ],
    "bring": "购物袋",
    "eat": "Mitsuwa 美食广场"
  },
  "Belmont Shore 散步": {
    "caps": [
      {
        "label": "小街",
        "icon": "house"
      },
      {
        "label": "咖啡",
        "icon": "cup"
      },
      {
        "label": "海边",
        "icon": "wave"
      }
    ],
    "steps": [
      "下午到 2nd Street",
      "一家一家逛小店和咖啡馆",
      "日落后去海边走走",
      "顺路去 Naples 小岛看看"
    ],
    "bring": "舒服的鞋",
    "eat": "2nd Street 随便挑"
  },
  "卡特琳娜岛再去一次": {
    "caps": [
      {
        "label": "小镇",
        "icon": "house"
      },
      {
        "label": "浮潜",
        "icon": "fish"
      },
      {
        "label": "玻璃底船",
        "icon": "boat"
      }
    ],
    "steps": [
      "提前订好 Catalina Express 船票",
      "上岛后在 Avalon 小镇逛一圈",
      "试试浮潜或玻璃底船",
      "赶最后一班船前吃晚饭"
    ],
    "bring": "晕船药、泳衣、防晒",
    "eat": "Avalon 海边餐厅"
  },
  "Joshua Tree 星空夜": {
    "caps": [
      {
        "label": "约书亚树",
        "icon": "tree"
      },
      {
        "label": "巨石",
        "icon": "mtn"
      },
      {
        "label": "银河",
        "icon": "moon"
      }
    ],
    "steps": [
      "挑没有月亮的晚上，出发前查月相",
      "白天去 Skull Rock 和 Keys View",
      "傍晚到 Cholla 仙人掌园",
      "天黑后躺下来看银河"
    ],
    "bring": "厚外套、水、头灯（里面没信号）",
    "eat": "Twentynine Palms 或 Yucca Valley"
  },
  "Disneyland 烟火夜": {
    "caps": [
      {
        "label": "城堡",
        "icon": "castle"
      },
      {
        "label": "烟火",
        "icon": "star"
      },
      {
        "label": "小镇",
        "icon": "house"
      }
    ],
    "steps": [
      "提前买好门票，下载迪士尼 App",
      "白天玩几个想玩的项目",
      "晚上提前在城堡前占位",
      "一起看烟火"
    ],
    "bring": "充电宝、外套",
    "eat": "园区里的小吃"
  },
  "环球影城再去一次": {
    "caps": [
      {
        "label": "城堡",
        "icon": "castle"
      },
      {
        "label": "黄油啤酒",
        "icon": "cup"
      },
      {
        "label": "圣诞",
        "icon": "star"
      }
    ],
    "steps": [
      "节日期间去看圣诞装饰",
      "先去哈利波特区喝黄油啤酒",
      "逛《鬼灵精》圣诞村",
      "晚上看夜景再回去"
    ],
    "bring": "充电宝",
    "eat": "园区里的餐厅"
  }
};

export const SPOT_ICON: Record<string, ArtIcon> = {
  "海滩": "wave",
  "散步": "house",
  "户外": "mtn",
  "城市": "wheel",
  "展览": "art",
  "夜景": "moon"
};

export type QuestionLevel = "l1" | "l2" | "l3" | "l4";
export const QUESTION_LEVELS: Record<QuestionLevel, string> = {
  "l1": "轻松",
  "l2": "走心",
  "l3": "脑洞",
  "l4": "🔥 心动"
};
export const QUESTIONS: Record<QuestionLevel, string[]> = {
  "l1": [
    "你最近一次笑到肚子疼是因为什么？",
    "如果只能吃一种食物一辈子，你选什么？",
    "你最喜欢的一首歌，为什么？",
    "你小时候的梦想是什么？",
    "说一个你不为人知的小习惯",
    "如果明天放假，你的完美一天怎么过？",
    "你最想拥有的超能力是什么？",
    "你觉得我身上最可爱的一点是？",
    "你最爱的季节和原因？",
    "你手机里最喜欢的一张照片是？",
    "你最怕的小东西是什么？",
    "早起还是熬夜，你是哪一派？"
  ],
  "l2": [
    "我们第一次见面，你的第一印象是什么？",
    "什么时候你最想念我？",
    "你觉得我们之间最好的一点是什么？",
    "有什么事让你对未来有点担心？",
    "我做什么会让你觉得被爱？",
    "你最近有没有一个小烦恼没告诉我？",
    "你理想中 5 年后的我们是什么样子？",
    "有什么话你一直想对我说？",
    "异地时你最难熬的是什么？",
    "你希望我们一起克服的一件事是什么？",
    "你最感谢我的一件小事？",
    "哪一刻让你觉得“就是他/她了”？"
  ],
  "l3": [
    "如果我们变成动物，会是什么？",
    "如果能穿越，你想去哪个年代？",
    "如果中了一千万，第一件事做什么？",
    "如果只能带三样东西去荒岛，你带什么？",
    "如果我们拍电影，片名叫什么？",
    "我们像哪一对动画或电影情侣？",
    "如果能和我交换一天身份，你想干嘛？",
    "给我们俩起个 CP 名吧",
    "如果可以开一家店，我们开什么？",
    "如果能瞬移，你现在最想去哪？",
    "用三个词形容我们的关系",
    "如果下次见面只有 24 小时，怎么过？"
  ],
  "l4": [
    "你最想在我身上留下什么记号？",
    "你觉得我穿什么最好看？什么最让你心动？",
    "如果现在在我身边，你会先亲哪里？",
    "你最喜欢我们哪一次牵手？",
    "说一个你偷偷看我的瞬间",
    "你最想和我一起洗的是泡泡浴还是一起做饭？",
    "你觉得我哪个声音最好听？",
    "我做什么会让你脸红？",
    "你最喜欢我叫你什么？",
    "如果只能抱我一个动作，你选哪种抱法？",
    "你会在什么时候特别想吻我？",
    "你最喜欢我身上的哪种味道？",
    "第一次和我牵手时你在想什么？",
    "你最喜欢我们靠得很近的哪个时刻？",
    "你觉得我们之间最暧昧的一次是什么时候？",
    "描述一下你理想中的晚安吻",
    "如果给今晚的我们设一个暗号，会是什么？",
    "你想让我在你耳边说什么？",
    "你最喜欢我哪一张照片？为什么？",
    "如果明天见面，你想穿什么让我心动？",
    "你更喜欢早安吻还是晚安吻？",
    "说一个你觉得我们之间很甜的小细节",
    "你最想和我一起度过一个怎样的雨夜？",
    "用一句话撩我一下",
    "你第一次想亲我是什么时候？",
    "给我们的第一个吻打几分？为什么？",
    "我身上你最喜欢的部位是哪里？",
    "你觉得我哪个瞬间最性感？",
    "我做什么小动作最能撩到你？",
    "用一个词形容我的吻",
    "你最喜欢我怎么抱你？",
    "如果今晚就能见面，你第一件事想做什么？",
    "描述一下你理想中和我一起度过的一个晚上",
    "你最喜欢我穿哪一套衣服？",
    "想我的时候，你脑子里第一个画面是什么？",
    "你更喜欢主动还是被我主动？",
    "说一件你想和我一起试试的小情趣",
    "你最想和我在哪里过夜？",
    "说一句你一直想对我说、但有点不好意思的话",
    "下次见面，你想让我穿什么？"
  ]
};

/** 每日一问题库，按日期轮换 */
export const DAILY_QUESTIONS: string[] = [
  "今天让你开心的一件小事是什么？",
  "如果现在能瞬移到我身边，你第一件事做什么？",
  "你最近一次想我是在什么时候？",
  "用三个词形容今天的你",
  "今天吃的最好吃的东西是什么？",
  "你现在最想和我去的地方是哪里？",
  "最近有没有一首歌让你想到我？",
  "你觉得我们最像哪种小动物？",
  "今天有没有什么事想跟我吐槽？",
  "如果明天我们见面，你想穿什么？",
  "你最喜欢我身上的哪个小习惯？",
  "说一件你小时候的糗事",
  "你理想中的周末是怎么过的？",
  "最近一次被我感动是什么时候？",
  "你觉得异地最难的是什么？",
  "有什么事你一直想学但还没开始？",
  "如果我们一起开一家店，卖什么？",
  "你最想和我一起看的电影是？",
  "你现在最想吃的一样东西",
  "你对我的第一印象是什么？",
  "最近有什么让你有点焦虑的事吗？",
  "描述一下你现在看到的窗外",
  "如果有一天假期，你想怎么和我过？",
  "你最喜欢我们哪一张合照？为什么？",
  "说一句你今天想对我说的话",
  "你觉得我最近有没有哪里变了？",
  "最想和我一起完成的一个小目标",
  "你睡前一般会想什么？",
  "如果可以给我一个超能力，你会给什么？",
  "今天最累的时刻是什么时候？",
  "你最喜欢的约会是哪一次？",
  "下次见面你想先拥抱还是先吃饭？",
  "最近在追什么剧或综艺？推荐给我",
  "你最怕我生气的哪种样子？",
  "如果我们养宠物，叫什么名字？",
  "这周你最期待的一件事是什么？",
  "你觉得我们之间最默契的一件事",
  "你最想收到的一份小礼物",
  "用一个表情形容今天的心情，并说说为什么",
  "如果今晚能一起吃宵夜，你想吃什么？",
  "你最近一次笑出声是因为什么？",
  "你想对一年后的我们说什么？",
  "最近学到的一个新东西",
  "你希望我多做的一件小事",
  "今天天气怎么样？你喜欢吗？",
  "说一个你觉得我不知道的你的小秘密",
  "如果我们去 road-trip，你想听什么歌？",
  "你最近的一个小烦恼，我能帮上什么忙？",
  "什么时候你觉得最被我爱着？",
  "想一下我们下次约会，你想安排什么？"
];

/** 扭蛋机小任务 */
export const GACHA_TASKS: string[] = [
  "给对方发一张你现在看到的天空",
  "录一段 10 秒的语音说“晚安”",
  "用三个 emoji 描述今天，发给对方",
  "给对方点一杯奶茶外卖",
  "找一首今天想送给对方的歌",
  "拍一张今天吃的饭发过去",
  "说出对方的三个优点",
  "今晚视频时一起喝同一种饮料",
  "写一张小纸条，下次见面交给对方",
  "给对方起一个新的可爱昵称",
  "分享一张你手机里最丑的自拍",
  "今天主动先说“我想你”",
  "一起定好下次见面要吃的第一顿饭",
  "把对方的照片设成手机壁纸一天",
  "给对方讲一个今天发生的小故事",
  "一起在心愿清单里加一个新心愿",
  "互相推荐一部电影，这周看完",
  "发一张你现在桌面的照片",
  "今天睡前视频 5 分钟",
  "模仿对方说话的语气说一句话",
  "一起在地图上找一个下次想去的地方",
  "给对方写三句情话",
  "今天对一个陌生人做一件好事，然后告诉对方",
  "拍一张今天穿搭发给对方",
  "一起回忆第一次约会的细节",
  "给对方唱一句歌",
  "选一个回忆，在网站上写一段日记",
  "说一件你最近为对方骄傲的事",
  "用一句话夸夸对方今天的样子",
  "一起挑一个周末的早午餐店",
  "给对方寄一张明信片",
  "今天喝 8 杯水，晚上互相汇报"
];
export const CAPSULE_COLORS: string[] = [
  "#ffb5c8",
  "#ffd6a5",
  "#fdf0a6",
  "#caf2c0",
  "#a8e3f2",
  "#d7c4ff"
];

export const ABOUT_DEFAULT_CATS = [
  {
    "id": "animal",
    "name": "喜欢的动物"
  },
  {
    "id": "food",
    "name": "爱吃的东西"
  },
  {
    "id": "gift",
    "name": "想收到的礼物"
  }
] as const;
