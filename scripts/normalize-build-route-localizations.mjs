import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");

const replacements = {
  ja: {
    builds: {
      "Standard Build": "標準ビルド",
      "Tank Build": "タンクビルド",
      "Bruiser Build": "ファイタービルド",
      "Bruiser/Tank Build": "ファイター/タンクビルド",
      "AP Build": "APビルド",
      "AP Build 2": "APビルド 2",
      "AP/Tank Build": "AP/タンクビルド",
      "AD Build": "ADビルド",
      "Crit Build": "クリティカルビルド",
      "Crit/On-hit Build": "クリティカル/通常効果ビルド",
      "On-Hit Build": "通常効果ビルド",
      "On-hit Build": "通常効果ビルド",
      "Attack Speed Crit": "攻撃速度/クリティカル",
      "Support Build": "サポートビルド",
      "Healing Build": "回復ビルド",
      "Double Tear Build": "ダブルティアビルド",
      "Draw Your Sword Build": "剣を抜けビルド",
      "Lethality Build": "脅威ビルド",
      "Terrain Expert Build": "地形専門ビルド",
      "No Terrain Expert Build": "地形専門なしビルド",
      "Ultimate Build": "アルティメットビルド",
      "Burst Build": "バーストビルド",
      "Utility AP Build": "ユーティリティAPビルド",
      "Bruiser Mage": "メイジファイタービルド",
      "Circle of Death Build": "死の円環ビルド"
    },
    tags: {
      Default: "標準",
      Tank: "タンク",
      Bruiser: "ファイター",
      Durability: "耐久",
      AP: "AP",
      AD: "AD",
      Crit: "クリティカル",
      "On-Hit": "通常効果",
      DPS: "DPS",
      Support: "サポート",
      Healing: "回復",
      "Double Tear": "ダブルティア",
      "Draw Sword": "剣を抜け",
      Lethality: "脅威",
      Terrain: "地形",
      "No Terrain": "地形なし",
      Ultimate: "アルティメット",
      Burst: "バースト",
      "Utility AP": "ユーティリティAP",
      "Bruiser Mage": "メイジファイター",
      "Circle of Death": "死の円環"
    },
    scores: {
      "Needs review": "要確認",
      Stable: "安定",
      Strong: "強力"
    }
  },
  ko: {
    builds: {
      "Standard Build": "기본 빌드",
      "Tank Build": "탱커 빌드",
      "Bruiser Build": "브루저 빌드",
      "Bruiser/Tank Build": "브루저/탱커 빌드",
      "AP Build": "AP 빌드",
      "AP Build 2": "AP 빌드 2",
      "AP/Tank Build": "AP/탱커 빌드",
      "AD Build": "AD 빌드",
      "Crit Build": "치명타 빌드",
      "Crit/On-hit Build": "치명타/온힛 빌드",
      "On-Hit Build": "온힛 빌드",
      "On-hit Build": "온힛 빌드",
      "Attack Speed Crit": "공격 속도/치명타",
      "Support Build": "서포터 빌드",
      "Healing Build": "회복 빌드",
      "Double Tear Build": "쌍여눈 빌드",
      "Draw Your Sword Build": "검을 뽑아라 빌드",
      "Lethality Build": "방관 빌드",
      "Terrain Expert Build": "지형 전문가 빌드",
      "No Terrain Expert Build": "지형 전문가 없음 빌드",
      "Ultimate Build": "궁극기 빌드",
      "Burst Build": "폭딜 빌드",
      "Utility AP Build": "유틸 AP 빌드",
      "Bruiser Mage": "전투 마법사 빌드",
      "Circle of Death Build": "죽음의 고리 빌드"
    },
    tags: {
      Default: "기본",
      Tank: "탱커",
      Bruiser: "브루저",
      Durability: "내구",
      AP: "AP",
      AD: "AD",
      Crit: "치명타",
      "On-Hit": "온힛",
      DPS: "DPS",
      Support: "서포터",
      Healing: "회복",
      "Double Tear": "쌍여눈",
      "Draw Sword": "검을 뽑아라",
      Lethality: "방관",
      Terrain: "지형",
      "No Terrain": "지형 없음",
      Ultimate: "궁극기",
      Burst: "폭딜",
      "Utility AP": "유틸 AP",
      "Bruiser Mage": "전투 마법사",
      "Circle of Death": "죽음의 고리"
    },
    scores: {
      "Needs review": "검토 필요",
      Stable: "안정",
      Strong: "강력"
    }
  }
};

function replaceMap(map, dictionary) {
  if (!map) return false;
  let changed = false;
  if (Array.isArray(map)) {
    for (let index = 0; index < map.length; index += 1) {
      if (dictionary[map[index]]) {
        map[index] = dictionary[map[index]];
        changed = true;
      }
    }
    return changed;
  }
  for (const [key, value] of Object.entries(map)) {
    if (dictionary[value]) {
      map[key] = dictionary[value];
      changed = true;
    }
  }
  return changed;
}

let changedFiles = 0;

for (const fileName of await readdir(dataDir)) {
  if (!fileName.endsWith(".json")) continue;
  const file = path.join(dataDir, fileName);
  const data = JSON.parse(await readFile(file, "utf8"));
  let changed = false;

  for (const lang of ["ja", "ko"]) {
    const loc = data.localized?.[lang];
    if (!loc) continue;
    changed = replaceMap(loc.builds, replacements[lang].builds) || changed;
    changed = replaceMap(loc.buildTags, replacements[lang].tags) || changed;
    changed = replaceMap(loc.buildScores, replacements[lang].scores) || changed;
  }

  if (changed) {
    data.updatedAt = "2026-07-03";
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    changedFiles += 1;
  }
}

console.log(JSON.stringify({ changedFiles }, null, 2));
