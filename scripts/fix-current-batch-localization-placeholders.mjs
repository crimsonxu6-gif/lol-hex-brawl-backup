import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const generatorPath = path.join(rootDir, "scripts", "generate-build-review-report.mjs");

const generator = await readFile(generatorPath, "utf8");
const batchSource = generator.match(/const reviewBatchSlugs = \[([\s\S]*?)\];/)?.[1] || "";
const reviewBatchSlugs = [...batchSource.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

const routeText = {
  standard: {
    zh: ["常规出装", "常规"],
    en: ["Standard Build", "Standard"],
    ja: ["標準ビルド", "標準"],
    ko: ["일반 빌드", "일반"]
  },
  tank: {
    zh: ["肉装", "肉装"],
    en: ["Tank Build", "Tank"],
    ja: ["タンクビルド", "タンク"],
    ko: ["탱커 빌드", "탱커"]
  },
  ap: {
    zh: ["AP 出装", "AP"],
    en: ["AP Build", "AP"],
    ja: ["APビルド", "AP"],
    ko: ["AP 빌드", "AP"]
  },
  "ap-2": {
    zh: ["AP 出装 2", "AP 2"],
    en: ["AP Build 2", "AP 2"],
    ja: ["APビルド 2", "AP 2"],
    ko: ["AP 빌드 2", "AP 2"]
  },
  "ap-tank": {
    zh: ["AP/肉装", "AP/肉装"],
    en: ["AP/Tank Build", "AP/Tank"],
    ja: ["AP/タンクビルド", "AP/タンク"],
    ko: ["AP/탱커 빌드", "AP/탱커"]
  },
  bruiser: {
    zh: ["战士出装", "战士"],
    en: ["Bruiser Build", "Bruiser"],
    ja: ["ファイタービルド", "ファイター"],
    ko: ["전사 빌드", "전사"]
  },
  crit: {
    zh: ["暴击出装", "暴击"],
    en: ["Crit Build", "Crit"],
    ja: ["クリティカルビルド", "クリティカル"],
    ko: ["치명타 빌드", "치명타"]
  },
  "draw-sword": {
    zh: ["亮剑出装", "亮剑"],
    en: ["Draw Your Sword Build", "Draw Sword"],
    ja: ["ドロー・ユア・ソードビルド", "ドローソード"],
    ko: ["검을 들어라 빌드", "검을 들어라"]
  },
  lethality: {
    zh: ["穿甲出装", "穿甲"],
    en: ["Lethality Build", "Lethality"],
    ja: ["脅威ビルド", "脅威"],
    ko: ["물리 관통 빌드", "물리 관통"]
  },
  onhit: {
    zh: ["特效出装", "特效"],
    en: ["On-Hit Build", "On-Hit"],
    ja: ["オンヒットビルド", "オンヒット"],
    ko: ["적중 효과 빌드", "적중 효과"]
  },
  support: {
    zh: ["辅助出装", "辅助"],
    en: ["Support Build", "Support"],
    ja: ["サポートビルド", "サポート"],
    ko: ["서포터 빌드", "서포터"]
  },
  healing: {
    zh: ["治疗出装", "治疗"],
    en: ["Healing Build", "Healing"],
    ja: ["回復ビルド", "回復"],
    ko: ["회복 빌드", "회복"]
  },
  ad: {
    zh: ["AD 出装", "AD"],
    en: ["AD Build", "AD"],
    ja: ["ADビルド", "AD"],
    ko: ["AD 빌드", "AD"]
  },
  "double-tear": {
    zh: ["双女神泪出装", "双女神泪"],
    en: ["Double Tear Build", "Double Tear"],
    ja: ["ダブルティアビルド", "ダブルティア"],
    ko: ["쌍여눈 빌드", "쌍여눈"]
  }
};

const langCopy = {
  zh: {
    eyebrow: "海克斯大乱斗 · Patch 16.13",
    buildHint: "装备按当前审核数据展示，新增英雄会在装备复核后补齐。",
    hexHint: "海克斯按截图和一图流整理，后续会继续校对分阶。",
    guideTitle: "一图流攻略",
    guideHint: "导图仅用于核对装备和海克斯，详情页展示结构化数据。",
    score: "待审核"
  },
  en: {
    eyebrow: "Hex Brawl · Patch 16.13",
    buildHint: "Builds are shown from the current review data and will be refined after item review.",
    hexHint: "Hexes are organized from screenshots and guide images. Tier review is still in progress.",
    guideTitle: "Guide Image",
    guideHint: "Guide images are kept only for checking items and hexes; the detail page shows structured data.",
    score: "Needs review"
  },
  ja: {
    eyebrow: "ヘックスブロウル · Patch 16.13",
    buildHint: "ビルドは現在の確認データです。アイテム確認後に更新します。",
    hexHint: "ヘックスはスクリーンショットとガイド画像から整理しています。階級は確認中です。",
    guideTitle: "ガイド画像",
    guideHint: "ガイド画像は確認用です。詳細ページには構造化データを表示します。",
    score: "確認待ち"
  },
  ko: {
    eyebrow: "헥스 난투 · Patch 16.13",
    buildHint: "빌드는 현재 검토 데이터를 기준으로 표시하며 아이템 검토 후 보완합니다.",
    hexHint: "증강은 스크린샷과 가이드 이미지 기준으로 정리했으며 단계 검토가 진행 중입니다.",
    guideTitle: "가이드 이미지",
    guideHint: "가이드 이미지는 확인용이며 상세 페이지에는 구조화 데이터를 표시합니다.",
    score: "검토 필요"
  }
};

function routeKey(build) {
  return build?.key || build?.type || "standard";
}

function routeFallback(key, lang, field) {
  const parts = String(key || "standard").split("-");
  const labels = parts.map((part) => routeText[part]?.[lang]?.[field] || part.toUpperCase());
  return labels.join(lang === "zh" ? "/" : " / ");
}

function routeLabel(build, lang, field) {
  const key = routeKey(build);
  return routeText[key]?.[lang]?.[field] || routeText[build?.type]?.[lang]?.[field] || routeFallback(key, lang, field);
}

function ensureLocalized(data, lang) {
  data.localized ??= {};
  data.localized[lang] ??= {};
  data.localized[lang].builds ??= {};
  data.localized[lang].buildTags ??= {};
  data.localized[lang].buildScores ??= {};
  data.localized[lang].hexNames ??= {};
  return data.localized[lang];
}

const changed = [];

for (const slug of reviewBatchSlugs) {
  const file = path.join(dataDir, `${slug}.json`);
  const data = JSON.parse(await readFile(file, "utf8"));
  const builds = Array.isArray(data.builds) ? data.builds : [];

  for (const lang of ["zh", "en", "ja", "ko"]) {
    const loc = ensureLocalized(data, lang);
    const copy = langCopy[lang];
    loc.eyebrow = copy.eyebrow;
    loc.buildHint = copy.buildHint;
    loc.hexHint = copy.hexHint;
    loc.guideTitle = copy.guideTitle;
    loc.guideHint = copy.guideHint;
    const displayName = data.champion?.names?.[lang] || data.champion?.names?.zh || data.champion?.names?.en || data.champion?.id || slug;
    loc.meta = lang === "zh"
      ? `${displayName} 海克斯大乱斗数据页。`
      : `${displayName} Hex Brawl guide data.`;

    for (const build of builds) {
      const key = routeKey(build);
      loc.builds[key] = routeLabel(build, lang, 0);
      loc.buildTags[key] = routeLabel(build, lang, 1);
      loc.buildScores[key] = copy.score;
    }
  }

  const enName = data.champion?.names?.en || data.champion?.id || slug;
  data.champion.names ??= {};
  data.champion.names.ja = data.champion.names.ja && !data.champion.names.ja.includes("?") ? data.champion.names.ja : enName;
  data.champion.names.ko = data.champion.names.ko && !data.champion.names.ko.includes("?") ? data.champion.names.ko : enName;

  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  changed.push(slug);
}

console.log(JSON.stringify({ changed: changed.length }, null, 2));
