import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const guideDir = path.join(rootDir, "assets", "guides", "hex-brawl", "16.13");

const labels = {
  standard: {
    zh: ["常规出装", "常规", "待审核"],
    en: ["Standard Build", "Standard", "Needs review"],
    ja: ["標準ビルド", "標準", "要確認"],
    ko: ["기본 빌드", "기본", "검토 필요"]
  },
  tank: {
    zh: ["肉装", "肉装", "待审核"],
    en: ["Tank Build", "Tank", "Needs review"],
    ja: ["タンクビルド", "タンク", "要確認"],
    ko: ["탱커 빌드", "탱커", "검토 필요"]
  },
  ap: {
    zh: ["AP 出装", "AP", "待审核"],
    en: ["AP Build", "AP", "Needs review"],
    ja: ["APビルド", "AP", "要確認"],
    ko: ["AP 빌드", "AP", "검토 필요"]
  },
  bruiser: {
    zh: ["战士出装", "战士", "待审核"],
    en: ["Bruiser Build", "Bruiser", "Needs review"],
    ja: ["ファイタービルド", "ファイター", "要確認"],
    ko: ["브루저 빌드", "브루저", "검토 필요"]
  },
  crit: {
    zh: ["暴击出装", "暴击", "待审核"],
    en: ["Crit Build", "Crit", "Needs review"],
    ja: ["クリティカルビルド", "クリティカル", "要確認"],
    ko: ["치명타 빌드", "치명타", "검토 필요"]
  },
  healing: {
    zh: ["治疗出装", "治疗", "待审核"],
    en: ["Healing Build", "Healing", "Needs review"],
    ja: ["回復ビルド", "回復", "要確認"],
    ko: ["회복 빌드", "회복", "검토 필요"]
  },
  support: {
    zh: ["辅助出装", "辅助", "待审核"],
    en: ["Support Build", "Support", "Needs review"],
    ja: ["サポートビルド", "サポート", "要確認"],
    ko: ["서포터 빌드", "서포터", "검토 필요"]
  },
  ad: {
    zh: ["AD 出装", "AD", "待审核"],
    en: ["AD Build", "AD", "Needs review"],
    ja: ["ADビルド", "AD", "要確認"],
    ko: ["AD 빌드", "AD", "검토 필요"]
  },
  "death-ring": {
    zh: ["死亡之环出装", "死亡之环", "待审核"],
    en: ["Circle of Death Build", "Circle of Death", "Needs review"],
    ja: ["死の円環ビルド", "死の円環", "要確認"],
    ko: ["죽음의 고리 빌드", "죽음의 고리", "검토 필요"]
  }
};

const notes = {
  "death-ring": {
    zh: "拿到“死亡之环”时使用，堆生命值和治疗护盾装，保证附身队友后的持续保护能力。",
    en: "Use when taking Circle of Death: stack health plus healing and shielding items to keep attached allies protected.",
    ja: "「死の円環」を取った時用。体力と回復・シールド装備で、味方に付いた後の継続支援を重視します。",
    ko: "죽음의 고리를 선택했을 때 사용합니다. 체력과 회복/보호막 아이템으로 붙은 아군을 오래 지켜 줍니다."
  }
};

function labelFor(build, lang) {
  const key = build.key || build.type || "standard";
  const base = labels[key] || labels[build.type] || labels.standard;
  return base[lang] || labels.standard[lang];
}

async function load(slug) {
  const file = path.join(dataDir, `${slug}.json`);
  return { file, data: JSON.parse(await readFile(file, "utf8")) };
}

async function save(file, data) {
  data.updatedAt = "2026-07-03";
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function upsertBuild(data, build) {
  data.builds ??= [];
  const index = data.builds.findIndex((entry) => entry.key === build.key);
  if (index >= 0) {
    data.builds[index] = { ...data.builds[index], ...build };
  } else {
    data.builds.push(build);
  }
}

function relabel(data) {
  data.localized ??= {};
  for (const lang of ["zh", "en", "ja", "ko"]) {
    data.localized[lang] ??= {};
    data.localized[lang].builds = {};
    data.localized[lang].buildTags = {};
    data.localized[lang].buildScores = {};
    data.localized[lang].buildNotes = data.localized[lang].buildNotes || {};
    for (const build of data.builds || []) {
      const [name, tag, score] = labelFor(build, lang);
      data.localized[lang].builds[build.key] = name;
      data.localized[lang].buildTags[build.key] = tag;
      data.localized[lang].buildScores[build.key] = score;
      if (notes[build.key]?.[lang]) {
        data.localized[lang].buildNotes[build.key] = notes[build.key][lang];
      }
    }
    for (const key of Object.keys(data.localized[lang].buildNotes || {})) {
      if (!(data.builds || []).some((build) => build.key === key)) {
        delete data.localized[lang].buildNotes[key];
      }
    }
  }
}

function setItem(data, key, index, itemId) {
  const build = data.builds?.find((entry) => entry.key === key);
  if (!build?.items?.length) throw new Error(`Missing build ${data.champion?.slug}:${key}`);
  build.items[index] = itemId;
}

const changed = [];

for (const [slug, key, index, itemId] of [
  ["ryze", "ap", 2, 2522],
  ["senna", "healing", 4, 6620],
  ["jarvan-iv", "tank", 3, 3065],
  ["illaoi", "tank", 2, 3065]
]) {
  const { file, data } = await load(slug);
  setItem(data, key, index, itemId);
  relabel(data);
  await save(file, data);
  changed.push(`${slug}:${key}[${index + 1}]=${itemId}`);
}

{
  const { file, data } = await load("wukong");
  upsertBuild(data, {
    key: "tank",
    type: "tank",
    items: [3084, 2502, 3083, 2501, 3053, 3181]
  });
  relabel(data);
  await save(file, data);
  changed.push("wukong:tank added");
}

{
  const { file, data } = await load("yuumi");
  upsertBuild(data, {
    key: "death-ring",
    type: "support",
    items: [3083, 3065, 3107, 3222, 6621, 3137]
  });
  relabel(data);
  await save(file, data);
  changed.push("yuumi:death-ring added");
}

await copyFile(path.join(guideDir, "wukong-bruiser.jpg"), path.join(guideDir, "wukong-tank.jpg"));
await copyFile(path.join(guideDir, "yuumi-support.jpg"), path.join(guideDir, "yuumi-death-ring.jpg"));

console.log(JSON.stringify({ changed }, null, 2));
