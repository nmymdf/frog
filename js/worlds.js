'use strict';
/* =====================================================================
   資料表：世界 / 關卡 / 武器 / 變種能力 / 載具 / 平台 / 商店升級
   ===================================================================== */

/* ---------- 武器 ---------- */
const WEAPONS = {
  bubble: { name: '泡泡槍', desc: '發射泡泡打倒敵人', col: '#7fd8ff', dmg: 1, speed: 520, cd: .26, ammo: 18, pierce: 0, snd: 'shoot' },
  fire: { name: '火球砲', desc: '威力強、可穿透', col: '#ff7a2a', dmg: 2, speed: 600, cd: .34, ammo: 12, pierce: 1, snd: 'fire' },
  ice: { name: '冰凍光線', desc: '凍結敵人 4 秒', col: '#9fefff', dmg: 0, speed: 640, cd: .38, ammo: 10, pierce: 0, freeze: 4, snd: 'ice' },
  bolt: { name: '閃電鞭', desc: '瞬間電擊前方一整排', col: '#ffe93a', dmg: 2, speed: 0, cd: .55, ammo: 8, pierce: 99, snd: 'zap' },
  boomerang: { name: '迴旋鏢', desc: '飛出去再飛回來，打兩次', col: '#ffb347', dmg: 1, speed: 380, cd: .5, ammo: 12, pierce: 99, snd: 'swoosh' },
  spread: { name: '散彈泡泡', desc: '一次射出三發', col: '#b6a0ff', dmg: 1, speed: 480, cd: .4, ammo: 14, pierce: 0, snd: 'shoot' },
};
const WEAPON_IDS = Object.keys(WEAPONS);

/* ---------- 變種能力 ---------- */
const MUTS = {
  jump: { name: '超級彈跳', desc: '一次跳兩格，躲過車流', dur: 12, col: '#ffd34a' },
  fly: { name: '飛天蛙', desc: '長出翅膀，飛過水面和車子', dur: 8, col: '#bfe9ff' },
  ghost: { name: '幽靈蛙', desc: '穿過所有敵人', dur: 9, col: '#e4e9ff' },
  giant: { name: '巨無霸蛙', desc: '變超大，壓扁路上的一切', dur: 8, col: '#7be04b' },
  speed: { name: '閃電蛙', desc: '跳躍速度翻倍', dur: 10, col: '#ff8a2e' },
  freeze: { name: '冰凍蛙', desc: '落在水面會結成冰塊', dur: 12, col: '#8fd8f5' },
  shield: { name: '泡泡護盾', desc: '擋住一次傷害', dur: 20, col: '#7fc8ff' },
  slow: { name: '時間緩慢', desc: '所有敵人變慢', dur: 8, col: '#c9a0ff' },
  magnet: { name: '金幣磁鐵', desc: '自動吸附附近的金幣', dur: 15, col: '#ff5a5a' },
};
const MUT_IDS = Object.keys(MUTS);

/* ---------- 商店升級 ---------- */
const UPGRADES = [
  { id: 'hearts', name: '愛心加成', desc: '最大生命 +1', max: 3, cost: [200, 500, 1100], icon: (c, x, y, s) => Icons.heart(c, x, y, s) },
  { id: 'magnet', name: '磁力強化', desc: '吸金幣的範圍變大', max: 3, cost: [150, 400, 900], icon: (c, x, y, s) => Icons.m_magnet(c, x, y, s) },
  { id: 'power', name: '武器威力', desc: '所有武器傷害 +1（Lv2 起）', max: 2, cost: [600, 1500], icon: (c, x, y, s) => Icons.flame(c, x, y, s) },
  { id: 'ammo', name: '彈藥擴充', desc: '補給箱彈藥 +30%/級', max: 3, cost: [180, 450, 950], icon: (c, x, y, s) => Icons.spread(c, x, y, s) },
  { id: 'luck', name: '幸運四葉草', desc: '更多補給箱、寶石與金幣', max: 3, cost: [250, 600, 1300], icon: (c, x, y, s) => Icons.clover(c, x, y, s) },
];

/* ---------- 載具 / 敵人尺寸表（單位 px，面向右） ---------- */
const VEH = {
  // 池塘
  tractor: { w: 96, h: 42, sp: .7, hp: 3 }, pickup: { w: 92, h: 36, sp: 1, hp: 2 }, beetle: { w: 68, h: 34, sp: 1.15, hp: 1 },
  cart: { w: 112, h: 38, sp: .6, hp: 2 }, bike: { w: 56, h: 36, sp: 1.5, hp: 1 },
  // 都市
  taxi: { w: 74, h: 36, sp: 1.1, hp: 1 }, bus: { w: 150, h: 44, sp: .85, hp: 3 }, sports: { w: 78, h: 32, sp: 1.55, hp: 1 },
  police: { w: 78, h: 36, sp: 1.25, hp: 2 }, truck: { w: 132, h: 44, sp: .8, hp: 3 }, scooter: { w: 50, h: 34, sp: 1.35, hp: 1 },
  // 冰雪
  sled: { w: 98, h: 34, sp: 1, hp: 1 }, snowmobile: { w: 76, h: 36, sp: 1.4, hp: 2 }, plow: { w: 120, h: 44, sp: .7, hp: 3 },
  penguin: { w: 46, h: 34, sp: 1.2, hp: 1 }, skier: { w: 54, h: 38, sp: 1.3, hp: 1 },
  // 火山
  minecart: { w: 64, h: 38, sp: 1.2, hp: 2 }, buggy: { w: 84, h: 36, sp: 1.3, hp: 2 }, boulder: { w: 58, h: 52, sp: .9, hp: 3 },
  lizard: { w: 80, h: 30, sp: 1.5, hp: 1 }, drillcar: { w: 112, h: 42, sp: .8, hp: 3 },
  // 太空
  hover: { w: 76, h: 32, sp: 1.3, hp: 1 }, rover: { w: 92, h: 42, sp: .8, hp: 2 }, rocket: { w: 124, h: 30, sp: 1.6, hp: 2 },
  saucer: { w: 70, h: 36, sp: 1.2, hp: 1 }, tram: { w: 150, h: 40, sp: .9, hp: 3 },
  // 糖果
  candycar: { w: 72, h: 36, sp: 1.2, hp: 1 }, icecream: { w: 112, h: 44, sp: .8, hp: 3 }, donutwheel: { w: 56, h: 54, sp: 1, hp: 2 },
  gingerbread: { w: 44, h: 44, sp: 1.3, hp: 1 }, lollitrain: { w: 140, h: 36, sp: 1, hp: 2 },
  // 巡邏怪（在安全草地上走來走去）
  snake: { w: 54, h: 26, sp: 1, hp: 1, walker: 1 }, hedgehog: { w: 40, h: 30, sp: .8, hp: 1, walker: 1 },
  rat: { w: 44, h: 26, sp: 1.3, hp: 1, walker: 1 }, robodog: { w: 52, h: 34, sp: 1.1, hp: 2, walker: 1 },
  pengwalk: { w: 38, h: 42, sp: .8, hp: 1, walker: 1 }, polarbear: { w: 78, h: 46, sp: .7, hp: 3, walker: 1 },
  lavacrab: { w: 52, h: 32, sp: 1, hp: 2, walker: 1 }, imp: { w: 38, h: 42, sp: 1.2, hp: 1, walker: 1 },
  alien: { w: 44, h: 44, sp: 1, hp: 1, walker: 1 }, botwalk: { w: 50, h: 50, sp: .8, hp: 3, walker: 1 },
  gummy: { w: 40, h: 44, sp: 1, hp: 1, walker: 1 }, jelly: { w: 48, h: 40, sp: .8, hp: 2, walker: 1 },
};
/* ---------- 水面平台種類 ---------- */
const PLAT = {
  log: { w: [100, 200] }, turtle: { unit: 50, n: [2, 3], dive: true }, lily: { w: [50, 50] }, croc: { w: [150, 190], head: 44 },
  plank: { w: [90, 160] }, barrel: { w: [50, 50] }, boat: { w: [100, 130] },
  floe: { w: [80, 140], crack: true }, iceberg: { w: [140, 200] }, narwhal: { w: [150, 190], head: 40 },
  rock: { w: [60, 100], sink: true }, bigrock: { w: [130, 170] }, skullraft: { w: [90, 130] },
  asteroid: { w: [60, 110] }, hoverpad: { w: [90, 130], blink: true }, satellite: { w: [120, 160] },
  wafer: { w: [100, 180] }, donut: { w: [58, 58] }, marshmallow: { w: [70, 110] },
};

/* ---------- 世界 ---------- */
const WORLDS = [
  {
    id: 'pond', name: '青蛙池塘', sub: 'Froggy Pond', style: 'green', accent: '#4cc34a', skyTop: '#6fc8ff', skyBot: '#dff6ff',
    road: ['tractor', 'pickup', 'beetle', 'cart', 'bike'], water: ['log', 'turtle', 'lily', 'croc'], walker: ['snake', 'hedgehog'],
    props: ['tree', 'bush', 'rock', 'stump', 'mushroom'], flyer: 'bee', strike: 'acorn', weather: 'pollen', music: 'w0',
    roadName: '泥土路', waterName: '池塘', rail: false, boss: 'toad', fall: 'splash',
    lv: ['荷葉初體驗', '小河過木頭', '烏龜渡口', '蓮花池塘', '青蛙大馬路', '鱷魚河灣', '暴風雨之夜', '蟾蜍國王'],
    intro: '歡迎來到青蛙池塘！跳過馬路、搭上木頭，抵達對岸吧！',
  },
  {
    id: 'city', name: '霓虹都市', sub: 'Neon City', style: 'purple', accent: '#b05bff', skyTop: '#1a1040', skyBot: '#5b2a8a',
    road: ['taxi', 'bus', 'sports', 'police', 'truck', 'scooter'], water: ['plank', 'barrel', 'boat'], walker: ['rat', 'robodog'],
    props: ['lamp', 'trash', 'hydrant', 'bench', 'planter'], flyer: 'pigeon', strike: 'laser', weather: 'rain', music: 'w1',
    roadName: '馬路', waterName: '下水道', rail: true, boss: 'robo', fall: 'splash',
    lv: ['夜市街口', '霓虹斑馬線', '地鐵軌道', '下水道探險', '摩天大樓下', '午夜飆車道', '霓虹大道', '垃圾車大王'],
    intro: '夜晚的都市車水馬龍，小心火車和無人機！',
  },
  {
    id: 'snow', name: '冰雪王國', sub: 'Frozen Kingdom', style: 'blue', accent: '#58b8ff', skyTop: '#7fb8ff', skyBot: '#eaf6ff',
    road: ['sled', 'snowmobile', 'plow', 'penguin', 'skier'], water: ['floe', 'iceberg', 'narwhal'], walker: ['pengwalk', 'polarbear'],
    props: ['pine', 'igloo', 'snowman', 'crystal', 'iceRock'], flyer: 'snowowl', strike: 'icicle', weather: 'snow', music: 'w2',
    roadName: '雪道', waterName: '冰湖', rail: false, boss: 'yeti', fall: 'splash',
    lv: ['雪地小徑', '企鵝滑雪場', '浮冰湖', '極地漁港', '暴風雪山路', '冰川裂縫', '極光山谷', '雪怪巨人'],
    intro: '冰天雪地！浮冰會裂開，雪橇也跑得好快！',
  },
  {
    id: 'volcano', name: '火山冒險', sub: 'Volcano Quest', style: 'red', accent: '#ff6a2a', skyTop: '#3a0c14', skyBot: '#ff7a2a',
    road: ['minecart', 'buggy', 'boulder', 'lizard', 'drillcar'], water: ['rock', 'bigrock', 'skullraft'], walker: ['lavacrab', 'imp'],
    props: ['spike', 'deadtree', 'redcrystal', 'bones', 'torch'], flyer: 'firebat', strike: 'geyser', weather: 'embers', music: 'w3',
    roadName: '礦坑軌道', waterName: '熔岩', rail: true, boss: 'dragon', fall: 'burn',
    lv: ['熔岩入口', '礦坑大逃亡', '岩漿河谷', '骷髏橋', '噴發前夕', '黑曜石荒原', '火焰迷宮', '火龍之巢'],
    intro: '腳下是滾燙的岩漿！小心噴發的間歇泉！',
  },
  {
    id: 'space', name: '星際太空', sub: 'Galaxy Station', style: 'teal', accent: '#31d6c0', skyTop: '#05071a', skyBot: '#2a1a60',
    road: ['hover', 'rover', 'rocket', 'saucer', 'tram'], water: ['asteroid', 'hoverpad', 'satellite'], walker: ['alien', 'botwalk'],
    props: ['antenna', 'crate', 'reactor', 'dome', 'panel'], flyer: 'ufo', strike: 'meteor', weather: 'stars', music: 'w4',
    roadName: '磁浮軌道', waterName: '外太空', rail: true, boss: 'mother', fall: 'void',
    lv: ['太空站出口', '磁浮軌道', '小行星帶', '衛星公園', '失重走廊', '彗星尾巴', '星環大道', '外星母艦'],
    intro: '失重的世界！跳過小行星，別掉進宇宙深處！',
  },
  {
    id: 'candy', name: '糖果樂園', sub: 'Candy Land', style: 'pink', accent: '#ff6fb5', skyTop: '#ffa8de', skyBot: '#fff0fb',
    road: ['candycar', 'icecream', 'donutwheel', 'gingerbread', 'lollitrain'], water: ['wafer', 'donut', 'marshmallow'], walker: ['gummy', 'jelly'],
    props: ['lolly', 'cane', 'cupcake', 'gumdrop', 'cookie'], flyer: 'candybird', strike: 'gumdrop', weather: 'sprinkles', music: 'w5',
    roadName: '巧克力路', waterName: '巧克力河', rail: false, boss: 'cake', fall: 'splash',
    lv: ['棉花糖草原', '甜甜圈渡口', '餅乾小鎮', '巧克力瀑布', '冰淇淋大道', '棒棒糖森林', '彩虹糖大道', '蛋糕怪獸'],
    intro: '甜蜜的終點站！但這裡的糖果可是會咬人的喔！',
  },
];
/* 每個世界 8 關（前 7 關一般、第 8 關魔王），共 48 關；難度依序漸增 */
WORLDS.forEach((w, wi) => {
  w.levels = w.lv.map((name, li) => {
    if (li === w.lv.length - 1) return { name, boss: true, d: clamp(.5 + wi * .09, 0, .95) };
    return { name, rows: 20 + li * 2 + Math.floor(wi * 1.2), d: clamp(.06 + wi * .12 + li * .045, 0, .96) };
  });
});
const LEVELS_PER_WORLD = 8;
const TOTAL_LEVELS = WORLDS.length * LEVELS_PER_WORLD;
function levelId(wi, li) { return wi * LEVELS_PER_WORLD + li; }
function levelDef(id) { const wi = Math.floor(id / LEVELS_PER_WORLD), li = id % LEVELS_PER_WORLD; return { wi, li, world: WORLDS[wi], def: WORLDS[wi].levels[li] }; }
