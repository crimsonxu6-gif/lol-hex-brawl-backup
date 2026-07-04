import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const patch = "16.12";
const gameDataVersion = "16.12.1";
const cdragonAssetBase = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";
const iconDirectoryCache = new Map();
const hexTopUps = {
  ahri: {
    gold: ["魄罗爆破手"]
  }
};

const zhBuildText = {
  "steel-door": { label: "肉装", tag: "坦度", score: "可选" }
};

const enBuildText = {
  standard: { label: "Standard Build", tag: "Default", score: "Recommended" },
  "bruiser-tank": { label: "Bruiser/Tank Build", tag: "Durability", score: "Recommended" },
  crit: { label: "Crit Build", tag: "Burst", score: "Strong" },
  "attack-speed": { label: "Attack Speed Crit", tag: "DPS", score: "Strong" },
  "crit-onhit": { label: "Crit/On-hit Build", tag: "AD", score: "Recommended" },
  ap: { label: "AP Build", tag: "AP", score: "Optional" },
  onhit: { label: "On-hit Build", tag: "AD", score: "Recommended" },
  "steel-door": { label: "Tank Build", tag: "Tank", score: "Optional" }
};

const champions = {
  yasuo: {
    builds: [{ key: "standard", label: "常规暴击", tag: "默认", score: "稳", items: [123430, 3032, 6333, 3065, 3031, 3006] }],
    guideHexes: {
      silver: ["暗影疾奔", "逃跑计划", "魔法转物理", "快中求稳", "灵巧", "渴血"],
      gold: ["牙仙子", "狂徒豪气", "术士果汁盒", "升级：无尽之刃", "灵魂虹吸"],
      prismatic: ["最终形态", "掷骰狂人", "巨人杀手", "秘术冲拳", "大地苏醒", "双刀流"]
    }
  },
  sett: {
    builds: [{ key: "bruiser-tank", label: "战士/肉装", tag: "坦度", score: "稳", items: [3084, 3083, 2501, 3161, 3053, 3111] }],
    guideHexes: {
      silver: ["俯冲轰炸", "扇巴掌", "大师铸就", "叠角龙", "大力", "魔法转物理", "重量级打击手"],
      gold: ["高压锅", "坦克引擎", "豪猪", "尖端发明家", "生机迸发", "任务：钢化你心"],
      prismatic: ["歌利亚巨人", "掷骰狂人", "科学狂人", "男爵之手", "任务：艾卡西亚的陷落", "飞身踢", "无限循环往复", "泰坦的坚决"]
    }
  },
  yone: {
    builds: [{ key: "standard", label: "常规出装", tag: "默认", score: "强", items: [3032, 123430, 6333, 3153, 3033, 3006] }],
    guideHexes: {
      silver: ["渴血", "逃跑计划", "会心防御", "快中求稳", "灵巧", "狂热者", "大力", "魔法转物理"],
      gold: ["牙仙子", "术士果汁盒", "闪现向前", "双发快射", "升级：无尽之刃", "灵魂虹吸"],
      prismatic: ["最终形态", "掷骰狂人", "巨人杀手", "秘术冲拳", "超负荷", "双刀流"]
    }
  },
  garen: {
    builds: [{ key: "crit", label: "暴击出装", tag: "爆发", score: "强", items: [6631, 3046, 3031, 3033, 6676, 3006] }],
    guideHexes: {
      silver: ["渴血", "逃跑计划", "旋转至胜", "升级：收集者", "速度恶魔", "大力", "由暴生急"],
      gold: ["罪恶快感", "有始有终", "灵魂虹吸", "最终都市列车", "一板一眼", "升级：无尽之刃"],
      prismatic: ["利刃华尔兹", "回归基本功", "巨人杀手", "小丑学院", "你肩上的恶魔", "舞会女王"]
    }
  },
  jinx: {
    builds: [{ key: "attack-speed", label: "攻速/暴击", tag: "默认", score: "强", items: [3032, 3031, 3033, 3085, 3153, 3006] }],
    guideHexes: {
      silver: ["灵巧", "升级：收集者", "点亮他们！", "渴血", "万用瞄准镜", "台风"],
      gold: ["灵魂虹吸", "闪电打击", "罪恶快感", "双发快射", "升级：无尽之刃", "暴击律动", "吸血习性", "更万用的瞄准镜"],
      prismatic: ["双刀流", "战争交响乐", "亮出你的剑", "最万用的瞄准镜", "踢踏舞", "巨人杀手"]
    }
  },
  ashe: {
    builds: [
      { key: "crit-onhit", label: "暴击/特效出装", tag: "AD", score: "稳", items: [3032, 3031, 3033, 3085, 3153, 3006] },
      { key: "ap", label: "AP 出装", tag: "AP", score: "功能", items: [3118, 4005, 6696, 3137, 3089, 3020] }
    ],
    guideHexes: {
      silver: ["灵巧", "万用瞄准镜", "逃跑计划", "渴血", "唯快不破", "台风", "点亮他们！", "物理转魔法", "扇巴掌", "侵蚀", "火狐"],
      gold: ["吸血习性", "闪电打击", "升级：无尽之刃", "暴击律动", "缩小引擎", "双发快射", "灵魂虹吸", "更万用的瞄准镜", "大法师", "牙仙子", "狙神飞星", "有始有终", "循环往复"],
      prismatic: ["双刀流", "战争交响乐", "飞身踢", "最万用的瞄准镜", "踢踏舞", "巨人杀手", "尤里卡", "掷骰狂人", "多重射击", "无限循环往复"]
    }
  },
  kaisa: {
    builds: [
      { key: "onhit", label: "特效/暴击出装", tag: "AD", score: "稳", items: [6672, 3124, 3153, 3302, 3115, 3006] },
      { key: "ap", label: "AP 出装", tag: "AP", score: "消耗", items: [3042, 6655, 4645, 3137, 3089, 3020] }
    ],
    guideHexes: {
      silver: ["灵巧", "狂热者", "逃跑计划", "渴血", "万用瞄准镜", "台风", "点亮他们！", "物理转魔法", "炼狱龙魂", "纯粹主义者 - 术师", "海洋龙魂"],
      gold: ["接二连三", "闪电打击", "双发快射", "暴击律动", "吸血习性", "咏叹奏鸣", "虚幻武器", "溢流", "缩小引擎", "魔法飞弹", "有始有终", "循环往复"],
      prismatic: ["巨人杀手", "战争交响乐", "双刀流", "秘术冲拳", "踢踏舞", "珠光护手", "尤里卡", "无限循环往复", "回归基本功", "任务：沃格勒特的巫师帽"]
    }
  },
  vayne: {
    builds: [{ key: "standard", label: "常规/爆发出装", tag: "默认", score: "强", items: [3153, 3124, 3302, 3091, 6665, 3006] }],
    guideHexes: {
      silver: ["灵巧", "点亮他们！", "渴血", "暗影疾奔", "台风", "万用瞄准镜"],
      gold: ["接二连三", "闪电打击", "吸血习性", "双发快射", "更万用的瞄准镜", "罪恶快感"],
      prismatic: ["双刀流", "战争交响乐", "连拨击锤", "亮出你的剑", "踢踏舞", "巨人杀手", "秘术冲拳"]
    }
  },
  zed: {
    builds: [{ key: "standard", label: "穿甲爆发", tag: "默认", score: "强", items: [126697, 6696, 6694, 6333, 2517, 3158] }],
    guideHexes: {
      silver: ["渴血", "俯冲轰炸", "刃下生风", "负重爆气", "霸符兄弟", "升级：收集者"],
      gold: ["吸血习性", "升级：狂妄", "缩小引擎", "有始有终", "杀戮时间到了", "裁决使"],
      prismatic: ["最终形态", "小丑学院", "回归基本功", "珠光护手", "无限循环往复", "量子计算", "科学狂人", "巨人杀手"]
    }
  },
  katarina: {
    builds: [{ key: "standard", label: "常规出装", tag: "混伤", score: "稳", items: [6631, 6672, 3153, 3302, 3073, 6333] }],
    guideHexes: {
      silver: ["旋转至胜", "灵巧", "渴血", "终极不可阻挡", "俯冲轰炸", "纯粹主义者 - 术师"],
      gold: ["吸血习性", "虚幻武器", "一板一眼", "有始有终", "易损", "最终都市列车"],
      prismatic: ["最终形态", "物法皆修", "巨人杀手", "小丑学院", "珠光护手", "你摸不到", "舞会女王", "虚空裂隙", "精怪魔法", "秘术冲拳"]
    }
  },
  "master-yi": {
    builds: [{ key: "standard", label: "常规/爆穿出装", tag: "默认", score: "强", items: [6676, 3153, 3073, 6333, 3036, 3006] }],
    guideHexes: {
      silver: ["升级：收集者", "负重爆气", "渴血", "台风", "点亮他们！", "灵巧", "狂热者", "逃跑计划"],
      gold: ["双发快射", "吸血习性", "升级：无尽之刃", "闪电打击", "更万用的瞄准镜", "循环往复"],
      prismatic: ["最终形态", "双刀流", "巨人杀手", "小丑学院", "舞会女王", "最万用的瞄准镜", "全凭身法"]
    }
  },
  "lee-sin": {
    builds: [{ key: "standard", label: "战士穿甲", tag: "默认", score: "稳", items: [126697, 6610, 6333, 2517, 3036, 3111] }],
    guideHexes: {
      silver: ["暗影疾奔", "俯冲轰炸", "自我毁灭", "快中求稳", "大力", "渴血"],
      gold: ["有始有终", "升级：狂妄", "吸血习性", "狂徒豪气", "最终都市列车", "裁决使"],
      prismatic: ["最终形态", "小丑学院", "巨人杀手", "魄罗之王的弹跳", "珠光护手", "舞会女王", "量子计算"]
    }
  },
  lux: {
    builds: [{ key: "standard", label: "法穿爆发", tag: "默认", score: "强", items: [6655, 4645, 3089, 3135, 4646, 3020] }],
    guideHexes: {
      silver: ["物理转魔法", "火狐", "扇巴掌", "家园卫士", "渴血", "升级：中娅"],
      gold: ["缩小引擎", "术士果汁盒", "超凡邪恶", "牙仙子", "大法师", "狙神飞星", "有始有终"],
      prismatic: ["尤里卡", "多重射击", "巨人杀手", "掷骰狂人", "无限循环往复", "任务：沃格勒特的巫师帽"]
    }
  },
  ahri: {
    builds: [{ key: "standard", label: "常规爆发", tag: "默认", score: "稳", items: [3118, 4645, 3089, 3135, 4646, 3020] }],
    guideHexes: {
      silver: ["物理转魔法", "帽上加帽", "火狐", "渴血", "海洋龙魂", "霸符兄弟", "暗影疾奔", "速度恶魔"],
      gold: ["卢登爆破手", "溢流", "超凡邪恶", "缩小引擎", "裁决使"],
      prismatic: ["全凭身法", "珠光护手", "巨人杀手", "终极唤醒", "尤里卡", "无限循环往复", "任务：沃格勒特的巫师帽"]
    }
  },
  ezreal: {
    builds: [{ key: "standard", label: "常规出装", tag: "默认", score: "稳", items: [3078, 3042, 3161, 3033, 3153, 3158] }],
    guideHexes: {
      silver: ["渴血", "大力", "魔法转物理", "纯粹主义者 - 术师", "升级：收集者", "海洋龙魂", "注魔"],
      gold: ["缩小引擎", "升级：耀光", "溢流", "吸血习性", "一板一眼", "老练狙神", "循环往复"],
      prismatic: ["亮出你的剑", "秘术冲拳", "无限循环往复", "回归基本功", "终极唤醒", "巨人杀手"]
    }
  },
  samira: {
    builds: [{ key: "standard", label: "常规出装", tag: "默认", score: "强", items: [6676, 3031, 3033, 6673, 3072, 3006] }],
    guideHexes: {
      silver: ["升级：收集者", "渴血", "逃跑计划", "大力", "会心防御", "旋转至胜", "终极不可阻挡"],
      gold: ["吸血习性", "最终都市列车", "有始有终", "灵魂虹吸", "会心治疗", "升级：无尽之刃", "杀戮时间到了"],
      prismatic: ["亮出你的剑", "巨人杀手", "回归基本功", "最终形态", "利刃华尔兹", "小丑学院", "男爵之手", "歌利亚巨人", "舞会女王", "精怪魔法"]
    }
  },
  darius: {
    builds: [
      { key: "standard", label: "常规出装", tag: "战士", score: "稳", items: [6610, 3161, 6333, 3071, 3053, 3111] },
      { key: "steel-door", label: "钢门出装", tag: "坦度", score: "可选", items: [3084, 3083, 2501, 3161, 3053, 3111] }
    ],
    guideHexes: {
      silver: ["旋转至胜", "逃跑计划", "重量级打击手", "练腿日", "速度恶魔", "大力", "渴血"],
      gold: ["罪恶快感", "缩小引擎", "闪现向前", "最终都市列车", "咏叹奏鸣", "任务：钢化你心"],
      prismatic: ["珠光护手", "小丑学院", "巨人杀手", "科学狂人", "歌利亚巨人", "舞会女王"]
    }
  },
  mordekaiser: {
    builds: [
      { key: "standard", label: "常规出装", tag: "AP 战士", score: "稳", items: [4633, 3116, 6653, 3073, 8010, 3111] },
      { key: "steel-door", label: "钢门出装", tag: "坦度", score: "可选", items: [3084, 2502, 3065, 3083, 6665, 4633] }
    ],
    guideHexes: {
      silver: ["物理转魔法", "逃跑计划", "帽上加帽", "重量级打击手", "负重爆气", "火狐", "速度恶魔", "侵蚀", "扇巴掌"],
      gold: ["神射法师", "裁决使", "超凡邪恶", "缩小引擎", "坦克引擎", "吞噬灵魂", "任务：钢化你心", "祖母的辣椒油"],
      prismatic: ["慢炖", "炼狱导管", "飞身踢", "死亡之环", "任务：艾卡西亚的陷落", "蛋白粉奶昔", "无限循环往复", "最终形态", "巨人杀手"]
    }
  },
  veigar: {
    builds: [{ key: "standard", label: "常规出装", tag: "法强", score: "强", items: [6657, 3089, 3003, 3135, 4645, 3020] }],
    guideHexes: {
      silver: ["物理转魔法", "扇巴掌", "火狐", "渴血", "负重爆气", "海洋龙魂", "霸符兄弟", "由心及物"],
      gold: ["缩小引擎", "溢流", "超凡邪恶", "祖母的辣椒油", "超强大脑", "吸血习性", "卢登爆破手", "魔法飞弹", "裁决使"],
      prismatic: ["尤里卡", "珠光护手", "巨人杀手", "科学狂人", "无限循环往复", "任务：沃格勒特的巫师帽"]
    }
  },
  kayle: {
    builds: [
      { key: "ap", label: "AP 出装", tag: "AP", score: "稳", items: [3115, 2510, 4645, 3089, 3135, 3020] },
      { key: "crit", label: "暴击出装", tag: "AD", score: "可选", items: [3032, 6675, 3033, 3031, 3153, 3006] }
    ],
    guideHexes: {
      silver: ["灵巧", "逃跑计划", "大师铸就", "火狐", "台风", "点亮他们！", "侵蚀"],
      gold: ["虚幻武器", "术士果汁盒", "超凡邪恶", "神射法师", "喂呜喂呜"],
      prismatic: ["双刀流", "秘术冲拳", "巨人杀手", "物法皆修", "踢踏舞", "掷骰狂人", "任务：沃格勒特的巫师帽"]
    }
  }
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function normalizeIconPath(iconPath) {
  return iconPath
    .replace(/^\/lol-game-data\/assets\//i, "assets/")
    .replace(/^\/lol-game-data\//i, "")
    .replace(/^\/+/, "")
    .toLowerCase()
    .replace(/^assets\/assets\//, "assets/");
}

async function iconDirectoryFiles(iconPath) {
  const slashIndex = iconPath.lastIndexOf("/");
  const directory = slashIndex === -1 ? "" : iconPath.slice(0, slashIndex + 1);
  if (iconDirectoryCache.has(directory)) return iconDirectoryCache.get(directory);

  const response = await fetch(cdragonAssetBase + directory);
  if (!response.ok) {
    const empty = new Set();
    iconDirectoryCache.set(directory, empty);
    return empty;
  }

  const html = await response.text();
  const files = new Set(
    [...html.matchAll(/href="([^"]+\.png)"/gi)].map((match) => decodeURIComponent(match[1]).toLowerCase())
  );
  iconDirectoryCache.set(directory, files);
  return files;
}

async function iconPathExists(iconPath) {
  const slashIndex = iconPath.lastIndexOf("/");
  const fileName = slashIndex === -1 ? iconPath : iconPath.slice(slashIndex + 1);
  const files = await iconDirectoryFiles(iconPath);
  return files.has(fileName.toLowerCase());
}

async function officialAugmentIconPath(augment) {
  const original = normalizeIconPath(augment.augmentSmallIconPath);
  const candidates = [];
  if (/_small(?=\.)/i.test(original)) {
    candidates.push(original.replace(/_small(?=\.)/i, "_large"));
    candidates.push(original.replace(/_small(?=\.)/i, ""));
  }
  if (/_small\.png$/i.test(original)) {
    candidates.push(original.replace(/_small\.png$/i, "_large.png"));
    candidates.push(original.replace(/_small\.png$/i, ".png"));
  }
  candidates.push(original);

  for (const candidate of candidates) {
    if (await iconPathExists(candidate)) return candidate;
  }
  return original;
}

function extractRunePickMap(slug, tier) {
  const xmlPath = path.join(rootDir, "captures", "hex-brawl", patch, slug, `runes-${tier}.xml`);
  return readFile(xmlPath, "utf8").then((xml) => {
    const texts = [...xml.matchAll(/<node\b[^>]*>/g)]
      .map((match) => match[0])
      .map((node) => {
        const text = /(?:\btext|\bcontent-desc)="([^"]*)"/.exec(node)?.[1] || "";
        const bounds = /\bbounds="\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]"/.exec(node);
        if (!text || !bounds) return "";
        const [, x1, y1, x2, y2] = bounds.map(Number);
        if (x2 <= x1 || y2 <= y1) return "";
        if (y1 < 400) return "";
        return text;
      })
      .filter(Boolean);
    const map = new Map();
    for (let index = 0; index < texts.length - 1; index += 1) {
      if (/^\d+(?:\.\d+)?%$/.test(texts[index + 1])) {
        map.set(texts[index], Number.parseFloat(texts[index + 1]));
      }
    }
    return map;
  });
}

async function extractCombinedRunePickMap(slug) {
  const maps = await Promise.all(["silver", "gold", "prismatic"].map((tier) => extractRunePickMap(slug, tier)));
  const combined = new Map();
  for (const map of maps) {
    for (const [name, pick] of map) {
      const current = combined.get(name);
      if (!Number.isFinite(current) || pick > current) combined.set(name, pick);
    }
  }
  return combined;
}

function augmentById(augments) {
  const map = new Map();
  for (const augment of augments) {
    map.set(augment.augmentNameId, augment);
    map.set(augment.augmentNameId.replace(/^ARAM_/, ""), augment);
  }
  return map;
}

async function rowForAugment(name, pick, augmentByName, localizedAugmentsById, localizedHexNames) {
  const augment = augmentByName.get(name);
  if (!augment) return null;
  const id = augment.augmentNameId.replace(/^ARAM_/, "");
  for (const [language, names] of Object.entries(localizedHexNames)) {
    names[id] =
      localizedAugmentsById[language]?.get(id)?.nameTRA ||
      localizedAugmentsById[language]?.get(augment.augmentNameId)?.nameTRA ||
      name;
  }
  return {
    id,
    icon: await officialAugmentIconPath(augment),
    pick: Number.isFinite(pick) ? pick : null
  };
}

async function buildRows(guideNames, runePickMap, augmentByName, localizedAugmentsById, localizedHexNames) {
  const matchedRows = [];
  const fallbackRows = [];
  const seen = new Set();
  for (const name of guideNames) {
    if (seen.has(name)) continue;
    seen.add(name);
    const pick = runePickMap.get(name);
    const row = await rowForAugment(name, pick, augmentByName, localizedAugmentsById, localizedHexNames);
    if (!row) continue;
    if (Number.isFinite(pick)) matchedRows.push(row);
    else fallbackRows.push(row);
  }
  matchedRows.sort((a, b) => b.pick - a.pick);
  return [...matchedRows, ...fallbackRows].slice(0, 8);
}

function buildLocalizedMap(builds, language, field) {
  const source = language === "zh" ? zhBuildText : enBuildText;
  return Object.fromEntries(
    builds.map((build) => {
      const override = source[build.key];
      if (override?.[field]) return [build.key, override[field]];
      if (language === "en") return [build.key, enBuildText.standard[field]];
      const originalField = field === "label" ? "label" : field;
      return [build.key, build[originalField]];
    })
  );
}

async function applyStructuredData() {
  const augments = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/cherry-augments.json");
  const augmentsEn = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json");
  const augmentsJa = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ja_jp/v1/cherry-augments.json");
  const augmentsKo = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json");
  const items = await fetchJson(`https://ddragon.leagueoflegends.com/cdn/${gameDataVersion}/data/zh_CN/item.json`);
  const augmentByName = new Map(augments.map((augment) => [augment.nameTRA, augment]));
  const localizedAugmentsById = {
    zh: augmentById(augments),
    en: augmentById(augmentsEn),
    ja: augmentById(augmentsJa),
    ko: augmentById(augmentsKo)
  };

  for (const [slug, config] of Object.entries(champions)) {
    for (const build of config.builds) {
      for (const itemId of build.items) {
        const item = items.data[itemId];
        if (!item) throw new Error(`${slug} uses missing item id ${itemId}`);
        if (item.maps && item.maps["12"] === false) {
          throw new Error(`${slug} uses non-ARAM item id ${itemId} (${item.name})`);
        }
      }
    }

    const file = path.join(dataDir, `${slug}.json`);
    const data = JSON.parse(await readFile(file, "utf8"));
    const localizedHexNames = { zh: {}, en: {}, ja: {}, ko: {} };
    const hexes = {};
    const pickMap = await extractCombinedRunePickMap(slug);
    for (const tier of ["silver", "gold", "prismatic"]) {
      const guideNames = [...(config.guideHexes[tier] || []), ...(hexTopUps[slug]?.[tier] || [])];
      hexes[tier] = {
        rows: await buildRows(guideNames, pickMap, augmentByName, localizedAugmentsById, localizedHexNames)
      };
    }

    data.schemaVersion = 3;
    data.gameDataVersion = gameDataVersion;
    data.updatedAt = "2026-06-26";
    data.dataStatus = "structured-review";
    data.sourceNote = "出装来自用户提供的一图流攻略，海克斯为一图流推荐与掌盟英雄符文榜截图的交集，待人工审核修正。";
    delete data.guideImages;
    delete data.runeScreenshots;
    data.builds = config.builds.map((build) => ({ key: build.key, items: build.items }));
    data.hexes = hexes;
    data.localized.zh.meta = `${data.champion.names.zh} 结构化出装与海克斯交集推荐，待人工审核。`;
    data.localized.zh.buildHint = "出装来自一图流主流路线；你审核后再按实际情况调整。";
    data.localized.zh.hexHint = "仅展示一图流和掌盟截图同时出现的海克斯。";
    data.localized.zh.builds = buildLocalizedMap(config.builds, "zh", "label");
    data.localized.zh.buildTags = buildLocalizedMap(config.builds, "zh", "tag");
    data.localized.zh.buildScores = buildLocalizedMap(config.builds, "zh", "score");
    data.localized.zh.hexNames = localizedHexNames.zh;
    data.localized.en = data.localized.en || {};
    data.localized.en.buildHint = "Builds are structured from the reviewed one-image guides and may still be adjusted after manual review.";
    data.localized.en.hexHint = "Hexes prioritize matches between guide images and captured app rankings; guide recommendations fill any tier below five entries.";
    data.localized.en.builds = buildLocalizedMap(config.builds, "en", "label");
    data.localized.en.buildTags = buildLocalizedMap(config.builds, "en", "tag");
    data.localized.en.buildScores = buildLocalizedMap(config.builds, "en", "score");
    data.localized.en.hexNames = localizedHexNames.en;
    data.localized.ja = data.localized.ja || {};
    data.localized.ko = data.localized.ko || {};
    data.localized.ja.builds = data.localized.en.builds;
    data.localized.ja.buildTags = data.localized.en.buildTags;
    data.localized.ja.buildScores = data.localized.en.buildScores;
    data.localized.ja.hexNames = localizedHexNames.ja;
    data.localized.ko.builds = data.localized.en.builds;
    data.localized.ko.buildTags = data.localized.en.buildTags;
    data.localized.ko.buildScores = data.localized.en.buildScores;
    data.localized.ko.hexNames = localizedHexNames.ko;
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  const brandFile = path.join(dataDir, "brand.json");
  const brandData = JSON.parse(await readFile(brandFile, "utf8"));
  delete brandData.guideImages;
  delete brandData.runeScreenshots;
  brandData.schemaVersion = Math.max(Number(brandData.schemaVersion || 1), 3);
  await writeFile(brandFile, `${JSON.stringify(brandData, null, 2)}\n`, "utf8");
}

async function patchDetailPages() {
  const championDirs = await readdir(path.join(rootDir, "champions"), { withFileTypes: true });
  for (const dirent of championDirs) {
    if (!dirent.isDirectory()) continue;
    const pagePath = path.join(rootDir, "champions", dirent.name, "hex-brawl", "index.html");
    let html;
    try {
      html = await readFile(pagePath, "utf8");
    } catch {
      continue;
    }
    html = html
      .replace("grid-template-columns: repeat(4, minmax(0, 1fr));", "grid-template-columns: repeat(3, minmax(0, 1fr));")
      .replace(
        `if (!guides.length) {
          list.innerHTML = '<div class="empty-card">' + escapeHtml(t().noGuides) + "</div>";
          return;
        }`,
        `if (!guides.length) {
          document.getElementById("guides").hidden = true;
          elements.guideTab.hidden = true;
          elements.guideTab.classList.remove("active");
          elements.buildTab.classList.add("active");
          return;
        }
        document.getElementById("guides").hidden = false;
        elements.guideTab.hidden = false;`
      )
      .replace(
        `noBuilds: "结构化装备还未录入，先参考上方一图流攻略图。",`,
        `noBuilds: "结构化装备还未录入。",`
      )
      .replace(
        `noHexes: "结构化海克斯还未录入，先参考一图流攻略图和下方掌盟符文截图。",`,
        `noHexes: "没有找到一图流和掌盟截图同时出现的海克斯。",`
      );
    await writeFile(pagePath, html, "utf8");
  }
}

await applyStructuredData();
await patchDetailPages();

console.log("Applied structured builds and tier-balanced hex recommendations.");
