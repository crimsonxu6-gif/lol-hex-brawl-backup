import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const itemDataPath = path.join(rootDir, ".cache", "ddragon-16.13.1-items", "item-en_US.json");
const reviewedLockPath = path.join(rootDir, "data", "hex-brawl", "reviewed-build-locks.json");
const forceReviewed = process.argv.includes("--force-reviewed");

const buildText = {
  standard: { zh: "常规出装", en: "Standard Build", ja: "標準ビルド", ko: "표준 빌드", tagZh: "默认", tagEn: "Default" },
  bruiser: { zh: "战士出装", en: "Bruiser Build", ja: "ファイタービルド", ko: "브루저 빌드", tagZh: "战士", tagEn: "Bruiser" },
  tank: { zh: "肉装", en: "Tank Build", ja: "タンクビルド", ko: "탱커 빌드", tagZh: "肉装", tagEn: "Tank" },
  ap: { zh: "AP 出装", en: "AP Build", ja: "AP ビルド", ko: "AP 빌드", tagZh: "AP", tagEn: "AP" },
  ad: { zh: "AD 出装", en: "AD Build", ja: "AD ビルド", ko: "AD 빌드", tagZh: "AD", tagEn: "AD" },
  crit: { zh: "暴击出装", en: "Crit Build", ja: "クリティカルビルド", ko: "치명타 빌드", tagZh: "暴击", tagEn: "Crit" },
  onhit: { zh: "特效出装", en: "On-hit Build", ja: "オンヒットビルド", ko: "온힛 빌드", tagZh: "特效", tagEn: "On-hit" },
  support: { zh: "辅助出装", en: "Support Build", ja: "サポートビルド", ko: "서포터 빌드", tagZh: "辅助", tagEn: "Support" },
  burst: { zh: "爆发出装", en: "Burst Build", ja: "バーストビルド", ko: "폭딜 빌드", tagZh: "爆发", tagEn: "Burst" },
  ult: { zh: "大招流出装", en: "Ultimate Build", ja: "アルティメットビルド", ko: "궁극기 빌드", tagZh: "大招流", tagEn: "Ultimate" }
};

const buildHints = {
  zh: "装备按16.13一图流主排录入，待审核。小角标只作替换提示。",
  en: "Builds are entered from the main rows of the 16.13 one-image guides and marked for review. Small corner icons are treated as swap notes.",
  ja: "16.13 guide main row. Review pending. Corner icons are swap notes.",
  ko: "16.13 guide main row. Review pending. Corner icons are swap notes."
};

// Item IDs are manually transcribed from the 16.13 one-image guides in captures/guide-source-16.13.
// Only items that exist in DDragon 16.13.1 and are enabled on map 12 are accepted below.
const guideBuilds = {
  "sion": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3083,
        3068,
        2501,
        3111
      ]
    }
  ],
  "aatrox": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        126697,
        6610,
        6333,
        2517,
        6694,
        3111
      ]
    }
  ],
  "akali": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        4646,
        4645,
        3089,
        3135,
        3157,
        3020
      ]
    }
  ],
  "anivia": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6657,
        6653,
        8010,
        4633,
        3089,
        3020
      ]
    }
  ],
  "annie": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        3118,
        6653,
        3116,
        3137,
        3089,
        3020
      ]
    }
  ],
  "aurelion-sol": [
    {
      "key": "standard",
      "type": "ap",
      "items": [
        3116,
        6653,
        8010,
        4633,
        2504,
        3083
      ],
      "label": {
        "zh": "半肉法坦",
        "en": "Bruiser Mage",
        "ja": "Bruiser Mage",
        "ko": "Bruiser Mage"
      },
      "tag": {
        "zh": "半肉",
        "en": "Bruiser Mage",
        "ja": "Bruiser Mage",
        "ko": "Bruiser Mage"
      }
    }
  ],
  "bard": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6655,
        3100,
        3089,
        4645,
        3137,
        3020
      ]
    }
  ],
  "belveth": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        6672,
        3153,
        3302,
        6665,
        6333,
        3111
      ]
    }
  ],
  "braum": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3083,
        3065,
        6665,
        3111
      ]
    }
  ],
  "camille": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        3078,
        3074,
        6333,
        2517,
        3161,
        3111
      ]
    }
  ],
  "cassiopeia": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6657,
        6653,
        3040,
        8010,
        3089,
        3020
      ]
    }
  ],
  "diana": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3083,
        6664,
        4633,
        6653
      ]
    },
    {
      "key": "ap",
      "type": "ap",
      "items": [
        3100,
        4645,
        3089,
        3135,
        4646,
        3020
      ]
    }
  ],
  "dr-mundo": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        3083,
        2501,
        3748,
        2517,
        3111
      ]
    }
  ],
  "evelynn": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        3100,
        4645,
        3089,
        3135,
        4646,
        3020
      ]
    }
  ],
  "graves": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        6676,
        3031,
        3033,
        6673,
        3072,
        3111
      ]
    }
  ],
  "irelia": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        3153,
        6610,
        6333,
        3748,
        3302,
        3111
      ]
    }
  ],
  "ivern": [
    {
      "key": "support",
      "type": "support",
      "items": [
        6617,
        3504,
        3107,
        6616,
        6621,
        3158
      ]
    }
  ],
  "kalista": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        3124,
        3153,
        3302,
        3085,
        6665,
        3006
      ]
    }
  ],
  "kayn": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        126697,
        6696,
        3071,
        6333,
        2517,
        3111
      ]
    }
  ],
  "kennen": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        3152,
        4645,
        3135,
        3089,
        3157,
        3020
      ]
    }
  ],
  "khazix": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        126697,
        6699,
        3036,
        6333,
        2517,
        3008
      ]
    }
  ],
  "leblanc": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6655,
        4645,
        3089,
        3137,
        4646,
        3020
      ]
    }
  ],
  "lillia": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        2503,
        6653,
        4633,
        3116,
        4629,
        3020
      ]
    }
  ],
  "lissandra": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        3118,
        4645,
        3157,
        3137,
        3089,
        3020
      ]
    }
  ],
  "lucian": [
    {
      "key": "standard",
      "type": "crit",
      "items": [
        6676,
        3031,
        3036,
        6696,
        2517,
        3008
      ]
    }
  ],
  "lulu": [
    {
      "key": "support",
      "type": "support",
      "items": [
        6617,
        3504,
        6621,
        3222,
        3107,
        3158
      ]
    }
  ],
  "miss-fortune": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        2503,
        6653,
        4645,
        3137,
        3089,
        3020
      ]
    },
    {
      "key": "crit",
      "type": "crit",
      "items": [
        6676,
        3031,
        3033,
        6673,
        3072,
        3006
      ],
      "label": {
        "zh": "暴击出装",
        "en": "Crit Build",
        "ja": "Crit Build",
        "ko": "Crit Build"
      },
      "tag": {
        "zh": "暴击",
        "en": "Crit",
        "ja": "Crit",
        "ko": "Crit"
      }
    },
    {
      "key": "ult",
      "type": "ult",
      "items": [
        6676,
        6696,
        3033,
        3031,
        6695,
        3006
      ]
    }
  ],
  "morgana": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        2503,
        6653,
        3116,
        4645,
        3068,
        3020
      ]
    }
  ],
  "naafiri": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        126697,
        6676,
        6333,
        3036,
        2517,
        3111
      ]
    }
  ],
  "neeko": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        3118,
        4645,
        3089,
        3137,
        3157,
        3020
      ]
    }
  ],
  "nilah": [
    {
      "key": "standard",
      "type": "crit",
      "items": [
        6676,
        3031,
        3033,
        6673,
        3072,
        3006
      ]
    }
  ],
  "nocturne": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        126697,
        6699,
        6696,
        6333,
        3036,
        2517
      ]
    }
  ],
  "nunu": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6655,
        4646,
        3089,
        4645,
        3135,
        3020
      ]
    },
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3065,
        3121,
        3083,
        4633
      ]
    }
  ],
  "olaf": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        6631,
        3073,
        2512,
        6333,
        3033,
        3006
      ]
    }
  ],
  "pantheon": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        126697,
        6672,
        6694,
        6333,
        2517,
        6692
      ]
    }
  ],
  "qiyana": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        126697,
        6696,
        6694,
        6333,
        2517,
        3158
      ]
    }
  ],
  "quinn": [
    {
      "key": "crit",
      "type": "crit",
      "items": [
        6676,
        3031,
        3033,
        2523,
        3153,
        3006
      ]
    },
    {
      "key": "onhit",
      "type": "onhit",
      "items": [
        6672,
        3153,
        3302,
        3085,
        3091,
        3006
      ]
    }
  ],
  "rek-sai": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        6610,
        3161,
        2501,
        6333,
        3071,
        3111
      ]
    },
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3065,
        2501,
        3083,
        3748
      ]
    }
  ],
  "rengar": [
    {
      "key": "standard",
      "type": "crit",
      "items": [
        126697,
        6676,
        3031,
        3033,
        6699,
        3158
      ]
    }
  ],
  "ornn": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3083,
        6665,
        3068,
        3111
      ]
    }
  ],
  "renekton": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        126697,
        6610,
        6333,
        3071,
        2517,
        3111
      ]
    }
  ],
  "seraphine": [
    {
      "key": "standard",
      "type": "ap",
      "items": [
        2503,
        3116,
        6653,
        3137,
        3089,
        3020
      ],
      "label": {
        "zh": "功能 AP 出装",
        "en": "Utility AP Build",
        "ja": "Utility AP Build",
        "ko": "Utility AP Build"
      },
      "tag": {
        "zh": "功能 AP",
        "en": "Utility AP",
        "ja": "Utility AP",
        "ko": "Utility AP"
      }
    },
    {
      "key": "burst",
      "type": "burst",
      "items": [
        6655,
        4645,
        3089,
        3135,
        4646,
        3020
      ]
    }
  ],
  "taliyah": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        2503,
        4645,
        3089,
        3135,
        4646,
        3020
      ]
    }
  ],
  "talon": [
    {
      "key": "standard",
      "type": "ad",
      "items": [
        126697,
        6696,
        6699,
        3033,
        6333,
        2517
      ]
    }
  ],
  "taric": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3121,
        3083,
        3065,
        3111
      ]
    }
  ],
  "trundle": [
    {
      "key": "terrain",
      "type": "ap",
      "items": [
        4005,
        2503,
        6653,
        4645,
        3137,
        3158
      ],
      "label": {
        "zh": "地形专家出装",
        "en": "Terrain Expert Build",
        "ja": "Terrain Expert Build",
        "ko": "Terrain Expert Build"
      },
      "tag": {
        "zh": "地形专家",
        "en": "Terrain",
        "ja": "Terrain",
        "ko": "Terrain"
      }
    },
    {
      "key": "ap",
      "type": "ap",
      "items": [
        4005,
        4645,
        3089,
        3118,
        3137,
        3020
      ],
      "label": {
        "zh": "无地形专家出装",
        "en": "No Terrain Expert Build",
        "ja": "No Terrain Expert Build",
        "ko": "No Terrain Expert Build"
      },
      "tag": {
        "zh": "无地形专家",
        "en": "No Terrain",
        "ja": "No Terrain",
        "ko": "No Terrain"
      }
    },
    {
      "key": "bruiser",
      "type": "bruiser",
      "items": [
        3078,
        6610,
        3748,
        6333,
        3153,
        3111
      ]
    }
  ],
  "urgot": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        3083,
        2501,
        3748,
        3071,
        3111
      ]
    },
    {
      "key": "ad",
      "type": "ad",
      "items": [
        126697,
        6676,
        3036,
        6333,
        2517,
        3111
      ]
    }
  ],
  "vi": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        126697,
        6610,
        6333,
        3033,
        2517,
        3111
      ]
    },
    {
      "key": "burst",
      "type": "ad",
      "items": [
        126697,
        6676,
        3036,
        3031,
        2517,
        6333
      ],
      "label": {
        "zh": "爆穿出装",
        "en": "Burst Build",
        "ja": "Burst Build",
        "ko": "Burst Build"
      },
      "tag": {
        "zh": "爆穿",
        "en": "Burst",
        "ja": "Burst",
        "ko": "Burst"
      }
    }
  ],
  "warwick": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        6610,
        3153,
        6333,
        3065,
        3053,
        3111
      ]
    }
  ],
  "yorick": [
    {
      "key": "standard",
      "type": "bruiser",
      "items": [
        6662,
        6610,
        3065,
        2501,
        6665,
        3111
      ]
    },
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3083,
        3065,
        2501,
        3111
      ]
    }
  ],
  "zac": [
    {
      "key": "tank",
      "type": "tank",
      "items": [
        3084,
        2502,
        3065,
        3083,
        4633,
        3111
      ]
    }
  ],
  "zeri": [
    {
      "key": "standard",
      "type": "crit",
      "items": [
        3032,
        3031,
        3033,
        3085,
        3153,
        3006
      ]
    }
  ],
  "zoe": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6655,
        4645,
        3089,
        3135,
        4646,
        3020
      ]
    }
  ],
  "veigar": [
    {
      "key": "ap",
      "type": "ap",
      "items": [
        6655,
        4645,
        3089,
        3135,
        4646,
        3020
      ]
    }
  ]
};

async function readReviewedLocks() {
  try {
    const data = JSON.parse(await readFile(reviewedLockPath, "utf8"));
    return new Set(data.lockedSlugs || Object.keys(data.builds || {}));
  } catch {
    return new Set();
  }
}

function labelFor(build, lang, field) {
  const base = buildText[build.type] || buildText.standard;
  if (field === "label") return build.label?.[lang] || base[lang] || base.en;
  if (field === "tag") return build.tag?.[lang] || (lang === "zh" ? base.tagZh : base.tagEn);
  if (field === "score") {
    if (lang === "zh") return "待审核";
    if (lang === "ja") return "確認待ち";
    if (lang === "ko") return "검토 필요";
    return "Needs review";
  }
  return build.key;
}

const itemData = JSON.parse(await readFile(itemDataPath, "utf8")).data;
for (const [slug, builds] of Object.entries(guideBuilds)) {
  for (const build of builds) {
    for (const itemId of build.items) {
      const item = itemData[itemId];
      if (!item) throw new Error(`${slug}/${build.key}: missing item ${itemId}`);
      if (item.maps?.["12"] === false) throw new Error(`${slug}/${build.key}: item ${itemId} is not enabled on map 12 (${item.name})`);
    }
  }
}

const lockedSlugs = forceReviewed ? new Set() : await readReviewedLocks();
let updated = 0;
let skipped = 0;
for (const [slug, builds] of Object.entries(guideBuilds)) {
  if (lockedSlugs.has(slug)) {
    skipped += 1;
    continue;
  }
  const file = path.join(dataDir, `${slug}.json`);
  const data = JSON.parse(await readFile(file, "utf8"));
  data.patch = "16.13";
  data.gameDataVersion = "16.13.1";
  data.updatedAt = "2026-06-30";
  data.dataStatus = "builds-needs-review";
  data.builds = builds.map((build) => ({
    key: build.key,
    items: build.items
  }));

  for (const lang of ["zh", "en", "ja", "ko"]) {
    data.localized ??= {};
    data.localized[lang] ??= {};
    data.localized[lang].builds = Object.fromEntries(builds.map((build) => [build.key, labelFor(build, lang, "label")]));
    data.localized[lang].buildTags = Object.fromEntries(builds.map((build) => [build.key, labelFor(build, lang, "tag")]));
    data.localized[lang].buildScores = Object.fromEntries(builds.map((build) => [build.key, labelFor(build, lang, "score")]));
    data.localized[lang].buildHint = buildHints[lang] || buildHints.en;
  }

  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  updated += 1;
}

console.log(`Imported guide builds for ${updated} champions. Skipped ${skipped} reviewed champions.`);
