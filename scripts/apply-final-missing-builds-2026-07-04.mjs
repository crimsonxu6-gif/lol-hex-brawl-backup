import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const guideDir = path.join(rootDir, "assets", "guides", "hex-brawl", "16.13");
const championsDir = path.join(rootDir, "champions");
const patch = "16.13";
const gameDataVersion = "16.13.1";
const updatedAt = "2026-07-04";

const officialAugmentSupplements = {
  Erosion: {
    id: "Erosion",
    icon: "assets/ux/cherry/augments/icons/erosion_small.png",
    names: {
      zh: "侵蚀",
      en: "Erosion",
      ja: "Erosion",
      ko: "Erosion"
    }
  }
};

const guideSources = [
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/8ed195b529f374b20a40f1e04b6998da.jpg", "vladimir-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/3d16b086959914048063f4fe4e9b14bd.jpg", "karthus-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/2c2e21c605675ff8ef34d15f18f74846/45f85b055468ed7fce082ac38132895b.jpg", "nidalee-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/b11046f43d8a02aacedead4e1f9c510a.jpg", "teemo-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/121af5469bdcdffcbc61b606b1a6b524.jpg", "maokai-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/3d52f9144d85f1809eb6579ef6899af9.jpg", "swain-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/10c9d38cdc5a528c659c682215af8ffb.jpg", "soraka-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/2cc1942e554cd63ffaa46b6259b7aca4.jpg", "twitch-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/25a5a106d09d3ab5187a21b8dfbba5ad.jpg", "locke-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/480d4f9906357a80ac530a92990fa792.jpg", "xayah-standard.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/3ad7fe1c1f7f6111729135b2f190753b.jpg", "yunara-wildarrows.jpg"],
  ["D:/xwechat_files/wxid_l5guxhzcpmp912_8176/temp/RWTemp/2026-07/9e20f478899dc29eb19741386f9343c8/3ad7fe1c1f7f6111729135b2f190753b.jpg", "yunara-kraken.jpg"]
];

const buildsBySlug = {
  vladimir: [
    { key: "standard", type: "ap", items: [3087, 4645, 6653, 3118, 4633, 3020] }
  ],
  karthus: [
    { key: "standard", type: "ap", items: [2503, 6653, 4645, 4637, 3118, 4636] }
  ],
  nidalee: [
    { key: "standard", type: "ap", items: [6655, 4645, 3089, 3135, 4646, 3020] },
    { key: "double-burn", type: "ap", items: [2503, 6653, 4645, 3089, 3137, 3020] }
  ],
  teemo: [
    { key: "standard", type: "ap", items: [3118, 6653, 4645, 8010, 3089, 3158] }
  ],
  maokai: [
    { key: "standard", type: "tank", items: [3084, 2502, 3121, 3083, 3065, 3111] }
  ],
  swain: [
    { key: "standard", type: "ap-tank", items: [6657, 3116, 6653, 3068, 4633, 3111] }
  ],
  soraka: [
    { key: "standard", type: "support", items: [2526, 6617, 3504, 6621, 3107, 3158] }
  ],
  twitch: [
    { key: "standard", type: "onhit", items: [6672, 3094, 3031, 3033, 3153, 3006] }
  ],
  locke: [
    { key: "standard", type: "ap", items: [3100, 4645, 3089, 3118, 4646, 3020] }
  ],
  xayah: [
    { key: "standard", type: "crit", items: [6672, 3031, 3033, 6675, 3072, 3008] }
  ],
  yunara: [
    { key: "wildarrows", type: "crit", items: [3032, 3031, 3033, 3094, 3153, 3008] },
    { key: "kraken", type: "onhit", items: [6672, 3094, 3033, 3031, 3153, 3008] }
  ]
};

const fallbackChampionNames = {
  karthus: {
    id: "Karthus",
    names: {
      zh: "死亡颂唱者 卡尔萨斯",
      en: "the Deathsinger Karthus",
      ja: "死を歌う者 カーサス",
      ko: "죽음을 노래하는 자 카서스"
    }
  },
  maokai: {
    id: "Maokai",
    names: {
      zh: "扭曲树精 茂凯",
      en: "the Twisted Treant Maokai",
      ja: "歪みし樹人 マオカイ",
      ko: "뒤틀린 나무 정령 마오카이"
    }
  }
};

const manualHexesBySlug = {
  vladimir: {
    silver: ["ADAPt", "Firefox", "Goredrink", "WeightedPopoffs", "LegDay", "EscapePlan"],
    gold: [
      "SustainingStrike",
      "CelestialBody",
      "GrowthSpurt",
      "FromBeginningToEnd",
      "PhenomenalEvil",
      "Recursion",
      "ShrinkEngine",
      "Sonata"
    ],
    prismatic: [
      "Quest_VoidImmolation",
      "InfernalConduit",
      "GiantSlayer",
      "CircleofDeath",
      "OminousPact",
      "BacktoBasics",
      "UltimateAwakening",
      "InfiniteRecursion",
      "Eureka",
      "Quest_WoogletsWitchcap"
    ]
  },
  karthus: {
    silver: ["ForgedByTheMaster", "Firefox", "ADAPt", "DiveBomber", "Purist_Caster"],
    gold: [
      "PhenomenalEvil",
      "BurstingTeeth",
      "BangBang",
      "Overflow",
      "FromBeginningToEnd",
      "SpecializedEmpowerment",
      "BloodMoneyBurn"
    ],
    prismatic: [
      "OminousPact",
      "UltimateRevolution",
      "GiantSlayer",
      "Eureka",
      "BacktoBasics",
      "InfernalConduit",
      "InfiniteRecursion",
      "Quest_WoogletsWitchcap"
    ]
  },
  nidalee: {
    silver: ["WitchfulThinking", "ForgedByTheMaster", "InfernalConduit", "Purist_Caster", "ShadowRunner", "OceanSoul"],
    gold: [
      "MagicMissile",
      "FromBeginningToEnd",
      "WarlockJuicebox",
      "ShrinkRay",
      "BurstingTeeth",
      "SpecializedRecursion",
      "PhenomenalEvil",
      "Marksmage"
    ],
    prismatic: [
      "OutlawsGrit",
      "JeweledGauntlet",
      "GiantSlayer",
      "HandOfBaron",
      "FinalForm",
      "Missile_Split",
      "InfiniteRecursion",
      "Eureka",
      "Quest_WoogletsWitchcap"
    ]
  },
  teemo: {
    silver: ["Erosion", "EscapePlan", "ADAPt", "ForgedByTheMaster", "Purist_Caster", "Firefox"],
    gold: ["EtherealWeapon", "WarlockJuicebox", "PhenomenalEvil", "FromBeginningToEnd", "InfiniteRecursion", "ShrinkRay"],
    prismatic: [
      "FeyMagic",
      "InfiniteRecursion",
      "GiantSlayer",
      "MysticPunch",
      "InfernalConduit",
      "Eureka",
      "Archmage",
      "Quest_WoogletsWitchcap"
    ]
  },
  maokai: {
    silver: [
      "HeavyHitter",
      "DiveBomber",
      "SlapAround",
      "BluntForce",
      "Upgrade_Immolate",
      "OceanSoul",
      "MindtoMatter"
    ],
    gold: [
      "Overflow",
      "SoulEater",
      "ShrinkRay",
      "CelestialBody",
      "ApexInventor",
      "GrowthSpurt",
      "TankEngine",
      "Quest_SteelYourHeart"
    ],
    prismatic: [
      "Dropkick",
      "CircleofDeath",
      "InfiniteRecursion",
      "ProteinShake",
      "Quest_VoidImmolation",
      "SlowCooker",
      "Cruelty",
      "PromQueen",
      "CourageoftheColossus",
      "Goliath"
    ]
  },
  swain: {
    silver: ["WeightedPopoffs", "SlapAround", "IceCold", "EscapePlan", "Firefox", "SoulEater", "OceanSoul", "MindtoMatter"],
    gold: [
      "PhenomenalEvil",
      "Overflow",
      "ShrinkRay",
      "CelestialBody",
      "ApexInventor",
      "GrowthSpurt",
      "SoulEater",
      "Quest_SteelYourHeart",
      "TankEngine"
    ],
    prismatic: [
      "SlowCooker",
      "InfernalConduit",
      "Quest_VoidImmolation",
      "Goliath",
      "GiantSlayer",
      "UltimateAwakening",
      "Cruelty",
      "ProteinShake",
      "Dropkick",
      "FeyMagic",
      "CircleofDeath",
      "InfiniteRecursion"
    ]
  },
  soraka: {
    silver: ["TankItOrLeaveIt", "SonicBoom", "Homeguard", "OceanSoul", "FirstAidKit", "AllForYou"],
    gold: ["AllForYou", "ShrinkRay", "WeeWooWeeWoo", "Sonata", "CriticalHealing", "MercysStrike"],
    prismatic: ["SpiritBomb", "WindspeakersBlessing", "ProteinShake", "InfiniteRecursion", "BacktoBasics", "EmpyreanPromise"]
  },
  twitch: {
    silver: ["Terror", "Upgrade_Collector", "EscapePlan", "Deft", "BluntForce", "ADAPt", "Typhoon", "LightemUp"],
    gold: [
      "DoubleTap",
      "CriticalMissile",
      "FromBeginningToEnd",
      "Quickstep",
      "BurstingTeeth",
      "SoulSiphon",
      "Upgrade_IE",
      "LittleExtraHelp"
    ],
    prismatic: ["DualWield", "MadScientist", "OutlawsGrit", "FeyMagic", "FanTheHammer", "TapDancer", "GiantSlayer", "DrawYourSword"]
  },
  locke: {
    silver: ["Firefox", "WitchfulThinking", "ADAPt", "SwiftAndSafe", "ShadowRunner", "Goredrink", "OceanSoul"],
    gold: ["WarlockJuicebox", "EtherealWeapon", "Marksmage", "FromBeginningToEnd", "PhenomenalEvil", "BigBrain", "ShrinkRay", "BurstingTeeth"],
    prismatic: [
      "JeweledGauntlet",
      "FinalForm",
      "GiantSlayer",
      "DivineDomain",
      "Eureka",
      "InfiniteRecursion",
      "Quest_WoogletsWitchcap"
    ]
  },
  xayah: {
    silver: ["Deft", "Upgrade_Collector", "EscapePlan", "Goredrink", "BluntForce", "TankItOrLeaveIt"],
    gold: [
      "FromBeginningToEnd",
      "CriticalMissile",
      "Quickstep",
      "GetExcited",
      "BurstingTeeth",
      "SoulSiphon",
      "Upgrade_IE",
      "LittleExtraHelp"
    ],
    prismatic: ["DualWield", "OutlawsGrit", "BacktoBasics", "MysticPunch", "MadScientist", "TapDancer", "GiantSlayer", "DrawYourSword"]
  },
  yunara: {
    silver: ["Deft", "Zealot", "EscapePlan", "Goredrink", "TankItOrLeaveIt", "LightemUp"],
    gold: [
      "CriticalMissile",
      "GetExcited",
      "DoubleTap",
      "EtherealWeapon",
      "CriticalHealing",
      "SoulSiphon",
      "Upgrade_IE",
      "LittleExtraHelp"
    ],
    prismatic: ["DualWield", "DrawYourSword", "MasterofDuality", "OutlawsGrit", "MadScientist", "TapDancer", "GiantSlayer"]
  }
};

const labels = {
  standard: {
    zh: ["常规出装", "常规", "待审核"],
    en: ["Standard Build", "Standard", "Needs review"],
    ja: ["標準ビルド", "標準", "要確認"],
    ko: ["기본 빌드", "기본", "검토 필요"]
  },
  "double-burn": {
    zh: ["双烧出装", "双烧", "待审核"],
    en: ["Double Burn Build", "Double Burn", "Needs review"],
    ja: ["Double Burn Build", "Double Burn", "Needs review"],
    ko: ["Double Burn Build", "Double Burn", "Needs review"]
  },
  wildarrows: {
    zh: ["荒野剑出装", "荒野剑", "待审核"],
    en: ["Yun Tal Build", "Yun Tal", "Needs review"],
    ja: ["ユン・タルビルド", "ユン・タル", "要確認"],
    ko: ["윤 탈 빌드", "윤 탈", "검토 필요"]
  },
  kraken: {
    zh: ["海妖出装", "海妖", "待审核"],
    en: ["Kraken Build", "Kraken", "Needs review"],
    ja: ["クラーケンビルド", "クラーケン", "要確認"],
    ko: ["크라켄 빌드", "크라켄", "검토 필요"]
  },
  ap: {
    zh: ["AP 出装", "AP", "待审核"],
    en: ["AP Build", "AP", "Needs review"],
    ja: ["APビルド", "AP", "要確認"],
    ko: ["AP 빌드", "AP", "검토 필요"]
  },
  "ap-tank": {
    zh: ["AP/肉装", "AP/肉装", "待审核"],
    en: ["AP/Tank Build", "AP/Tank", "Needs review"],
    ja: ["AP/タンクビルド", "AP/タンク", "要確認"],
    ko: ["AP/탱커 빌드", "AP/탱커", "검토 필요"]
  },
  tank: {
    zh: ["肉装", "肉装", "待审核"],
    en: ["Tank Build", "Tank", "Needs review"],
    ja: ["タンクビルド", "タンク", "要確認"],
    ko: ["탱커 빌드", "탱커", "검토 필요"]
  },
  support: {
    zh: ["辅助出装", "辅助", "待审核"],
    en: ["Support Build", "Support", "Needs review"],
    ja: ["サポートビルド", "サポート", "要確認"],
    ko: ["서포터 빌드", "서포터", "검토 필요"]
  },
  onhit: {
    zh: ["特效出装", "特效", "待审核"],
    en: ["On-hit Build", "On-hit", "Needs review"],
    ja: ["通常効果ビルド", "通常効果", "要確認"],
    ko: ["온힛 빌드", "온힛", "검토 필요"]
  },
  crit: {
    zh: ["暴击出装", "暴击", "待审核"],
    en: ["Crit Build", "Crit", "Needs review"],
    ja: ["クリティカルビルド", "クリティカル", "要確認"],
    ko: ["치명타 빌드", "치명타", "검토 필요"]
  }
};

function emptyLocalized(names) {
  return {
    zh: {
      eyebrow: `海克斯大乱斗 · Patch ${patch}`,
      meta: `${names.zh} 海克斯大乱斗数据页。`,
      buildHint: "出装按已审核数据展示；新增英雄会在装备复核后补齐。",
      hexHint: "海克斯使用最新版官方图标；新增英雄先按掌盟截图选取率排序。",
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    },
    en: {
      eyebrow: `Hex Brawl · Patch ${patch}`,
      meta: `${names.en} Hex Brawl guide data.`,
      buildHint: "Reviewed builds are shown first. New champion builds will be added after item review.",
      hexHint: "Hexes use current official icons. New champions start from captured app rankings.",
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    },
    ja: {
      eyebrow: `ヘクスブロウル · Patch ${patch}`,
      meta: `${names.ja} Hex Brawl guide data.`,
      buildHint: "確認済みのビルドを表示します。新規チャンピオンの装備は確認後に追加します。",
      hexHint: "ヘクスは最新版の公式アイコンを使用します。",
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    },
    ko: {
      eyebrow: `헥스 난투 · Patch ${patch}`,
      meta: `${names.ko} Hex Brawl guide data.`,
      buildHint: "검수된 빌드를 먼저 표시합니다. 신규 챔피언 빌드는 장비 확인 후 추가됩니다.",
      hexHint: "증강은 최신 공식 아이콘을 사용합니다.",
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    }
  };
}

function labelFor(build, lang) {
  const key = build.key || build.type || "standard";
  const base = labels[key] || labels[build.type] || labels.standard;
  return base[lang] || labels.standard[lang];
}

async function loadOrCreate(slug) {
  const file = path.join(dataDir, `${slug}.json`);
  try {
    return { file, data: JSON.parse(await readFile(file, "utf8")), created: false };
  } catch {
    const fallback = fallbackChampionNames[slug];
    if (!fallback) throw new Error(`Missing data file and no fallback metadata: ${slug}`);
    const localized = emptyLocalized(fallback.names);
    return {
      file,
      created: true,
      data: {
        schemaVersion: 3,
        mode: "hex-brawl",
        patch,
        gameDataVersion,
        updatedAt,
        dataStatus: "builds-needs-review",
        sourceNote: "非 Riot 官方项目；装备来自人工审核数据，海克斯使用官方当前版本图标并结合掌盟截图整理。",
        champion: { id: fallback.id, slug, names: fallback.names },
        localized,
        builds: [],
        hexes: { silver: { rows: [] }, gold: { rows: [] }, prismatic: { rows: [] } }
      }
    };
  }
}

async function loadAugmentCatalog() {
  const catalog = new Map();
  const files = await readdir(dataDir);
  for (const fileName of files) {
    if (!fileName.endsWith(".json")) continue;
    const data = JSON.parse(await readFile(path.join(dataDir, fileName), "utf8"));
    const rows = [
      ...(data.hexes?.silver?.rows || []),
      ...(data.hexes?.gold?.rows || []),
      ...(data.hexes?.prismatic?.rows || [])
    ];
    for (const row of rows) {
      if (!row?.id || !row?.icon) continue;
      const current = catalog.get(row.id) || { id: row.id, icon: row.icon, names: {} };
      if (!current.icon) current.icon = row.icon;
      for (const lang of ["zh", "en", "ja", "ko"]) {
        const name = data.localized?.[lang]?.hexNames?.[row.id];
        if (name && !current.names[lang]) current.names[lang] = name;
      }
      catalog.set(row.id, current);
    }
  }
  for (const supplement of Object.values(officialAugmentSupplements)) {
    if (!catalog.has(supplement.id)) catalog.set(supplement.id, supplement);
  }
  return catalog;
}

function applyManualHexes(data, slug, catalog) {
  const manualHexes = manualHexesBySlug[slug];
  if (!manualHexes) return [];
  const missing = [];
  data.hexes ??= { silver: { rows: [] }, gold: { rows: [] }, prismatic: { rows: [] } };
  for (const tier of ["silver", "gold", "prismatic"]) {
    data.hexes[tier] ??= { rows: [] };
    data.hexes[tier].rows = [];
    for (const id of manualHexes[tier] || []) {
      const catalogRow = catalog.get(id);
      if (!catalogRow?.icon) {
        missing.push(id);
        continue;
      }
      data.hexes[tier].rows.push({ id, icon: catalogRow.icon, pick: null });
      for (const lang of ["zh", "en", "ja", "ko"]) {
        data.localized[lang].hexNames ??= {};
        if (catalogRow.names[lang]) data.localized[lang].hexNames[id] = catalogRow.names[lang];
      }
    }
  }
  return missing;
}

function relabel(data) {
  data.localized ??= emptyLocalized(data.champion.names);
  for (const lang of ["zh", "en", "ja", "ko"]) {
    data.localized[lang] ??= emptyLocalized(data.champion.names)[lang];
    data.localized[lang].builds = {};
    data.localized[lang].buildTags = {};
    data.localized[lang].buildScores = {};
    for (const build of data.builds || []) {
      const [name, tag, score] = labelFor(build, lang);
      data.localized[lang].builds[build.key] = name;
      data.localized[lang].buildTags[build.key] = tag;
      data.localized[lang].buildScores[build.key] = score;
    }
  }
}

async function writeDetailPage(slug) {
  const samplePath = path.join(championsDir, "brand", "hex-brawl", "index.html");
  let template = await readFile(samplePath, "utf8");
  template = template.replace(
    /const dataUrl = "\.\.\/\.\.\/\.\.\/data\/hex-brawl\/champions\/[^"]+\.json";/,
    'const dataUrl = "../../../data/hex-brawl/champions/__SLUG__.json";'
  );
  const pageDir = path.join(championsDir, slug, "hex-brawl");
  await mkdir(pageDir, { recursive: true });
  await writeFile(path.join(pageDir, "index.html"), template.replaceAll("__SLUG__", slug), "utf8");
}

await mkdir(guideDir, { recursive: true });
const augmentCatalog = await loadAugmentCatalog();
const copiedGuides = [];
for (const [source, targetName] of guideSources) {
  await copyFile(source, path.join(guideDir, targetName));
  copiedGuides.push(targetName);
}

const changed = [];
const missingManualHexes = {};
for (const [slug, builds] of Object.entries(buildsBySlug)) {
  const { file, data, created } = await loadOrCreate(slug);
  data.schemaVersion = 3;
  data.mode = "hex-brawl";
  data.patch = patch;
  data.gameDataVersion = gameDataVersion;
  data.updatedAt = updatedAt;
  data.dataStatus = "builds-needs-review";
  data.sourceNote = "非 Riot 官方项目；装备来自人工审核数据，海克斯使用官方当前版本图标并结合掌盟截图整理。";
  data.builds = builds;
  data.hexes ??= { silver: { rows: [] }, gold: { rows: [] }, prismatic: { rows: [] } };
  relabel(data);
  const missingHexes = applyManualHexes(data, slug, augmentCatalog);
  if (missingHexes.length > 0) missingManualHexes[slug] = missingHexes;
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  if (created) await writeDetailPage(slug);
  changed.push(`${slug}:${builds.length}`);
}

console.log(JSON.stringify({ copiedGuides, changed, missingManualHexes }, null, 2));
