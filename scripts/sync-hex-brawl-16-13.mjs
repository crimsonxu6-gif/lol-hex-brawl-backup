import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const championsDir = path.join(rootDir, "champions");
const guideSourceDir = path.join(rootDir, "captures", "guide-source-16.13");
const guideTargetDir = path.join(rootDir, "assets", "guides", "hex-brawl", "16.13");
const previousGuideDir = path.join(rootDir, "assets", "guides", "hex-brawl", "16.12");
const capturePatches = ["16.13", "16.12"];
const capturePatch = capturePatches[0];
const patch = "16.13";
const gameDataVersion = "16.13.1";
const updatedAt = "2026-06-29";
const cdragonAssetBase = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";
const iconDirectoryCache = new Map();

const guideMappings = [
  ["guide-01.jpg", "sion", "standard"],
  ["guide-02.jpg", "aatrox", "standard"],
  ["guide-03.jpg", "akali", "standard"],
  ["guide-04.jpg", "anivia", "standard"],
  ["guide-05.jpg", "annie", "standard"],
  ["guide-06.jpg", "aurelion-sol", "standard"],
  ["guide-07.jpg", "bard", "standard"],
  ["guide-08.jpg", "belveth", "standard"],
  ["guide-09.jpg", "braum", "standard"],
  ["guide-10.jpg", "camille", "standard"],
  ["guide-11.jpg", "cassiopeia", "standard"],
  ["guide-12.jpg", "diana", "standard"],
  ["guide-13.jpg", "diana", "alt"],
  ["guide-14.jpg", "dr-mundo", "standard"],
  ["guide-15.jpg", "evelynn", "standard"],
  ["guide-16.jpg", "graves", "standard"],
  ["guide-17.jpg", "irelia", "standard"],
  ["guide-18.jpg", "ivern", "standard"],
  ["guide-19.jpg", "kalista", "standard"],
  ["guide-20.jpg", "kayn", "standard"],
  ["guide-21.jpg", "kennen", "standard"],
  ["guide-22.jpg", "khazix", "standard"],
  ["guide-23.jpg", "leblanc", "standard"],
  ["guide-24.jpg", "lillia", "standard"],
  ["guide-25.jpg", "lissandra", "standard"],
  ["guide-26.jpg", "lucian", "standard"],
  ["guide-27.jpg", "lulu", "standard"],
  ["guide-28.jpg", "miss-fortune", "standard"],
  ["guide-29.jpg", "miss-fortune", "alt"],
  ["guide-30.jpg", "morgana", "standard"],
  ["guide-31.jpg", "naafiri", "standard"],
  ["guide-32.jpg", "neeko", "standard"],
  ["guide-33.jpg", "nilah", "standard"],
  ["guide-34.jpg", "nocturne", "standard"],
  ["guide-35.jpg", "nunu", "standard"],
  ["guide-36.jpg", "nunu", "alt"],
  ["guide-37.jpg", "olaf", "standard"],
  ["guide-38.jpg", "pantheon", "standard"],
  ["guide-39.jpg", "qiyana", "standard"],
  ["guide-40.jpg", "quinn", "standard"],
  ["guide-41.jpg", "rek-sai", "standard"],
  ["guide-42.jpg", "rengar", "standard"],
  ["guide-43.jpg", "ornn", "standard"],
  ["guide-44.jpg", "renekton", "standard"],
  ["guide-45.jpg", "seraphine", "standard"],
  ["guide-46.jpg", "taliyah", "standard"],
  ["guide-47.jpg", "talon", "standard"],
  ["guide-48.jpg", "taric", "standard"],
  ["guide-49.jpg", "trundle", "standard"],
  ["guide-50.jpg", "trundle", "alt"],
  ["guide-51.jpg", "urgot", "standard"],
  ["guide-52.jpg", "vi", "standard"],
  ["guide-53.jpg", "warwick", "standard"],
  ["guide-54.jpg", "yorick", "standard"],
  ["guide-55.jpg", "zac", "standard"],
  ["guide-56.jpg", "zeri", "standard"],
  ["guide-57.jpg", "zoe", "standard"],
  ["guide-new-01.jpg", "veigar", "standard"]
];

const slugToChampionId = {
  aatrox: "Aatrox",
  ahri: "Ahri",
  akali: "Akali",
  anivia: "Anivia",
  annie: "Annie",
  "aurelion-sol": "AurelionSol",
  ashe: "Ashe",
  bard: "Bard",
  belveth: "Belveth",
  brand: "Brand",
  braum: "Braum",
  camille: "Camille",
  cassiopeia: "Cassiopeia",
  darius: "Darius",
  diana: "Diana",
  "dr-mundo": "DrMundo",
  evelynn: "Evelynn",
  ezreal: "Ezreal",
  garen: "Garen",
  graves: "Graves",
  irelia: "Irelia",
  ivern: "Ivern",
  jinx: "Jinx",
  kaisa: "Kaisa",
  kalista: "Kalista",
  katarina: "Katarina",
  kayle: "Kayle",
  kayn: "Kayn",
  kennen: "Kennen",
  khazix: "Khazix",
  leblanc: "Leblanc",
  "lee-sin": "LeeSin",
  lillia: "Lillia",
  lissandra: "Lissandra",
  lucian: "Lucian",
  lulu: "Lulu",
  lux: "Lux",
  "master-yi": "MasterYi",
  "miss-fortune": "MissFortune",
  mordekaiser: "Mordekaiser",
  morgana: "Morgana",
  naafiri: "Naafiri",
  neeko: "Neeko",
  nilah: "Nilah",
  nocturne: "Nocturne",
  nunu: "Nunu",
  olaf: "Olaf",
  ornn: "Ornn",
  pantheon: "Pantheon",
  qiyana: "Qiyana",
  quinn: "Quinn",
  "rek-sai": "RekSai",
  renekton: "Renekton",
  rengar: "Rengar",
  samira: "Samira",
  seraphine: "Seraphine",
  sett: "Sett",
  sion: "Sion",
  taliyah: "Taliyah",
  talon: "Talon",
  taric: "Taric",
  trundle: "Trundle",
  urgot: "Urgot",
  vayne: "Vayne",
  veigar: "Veigar",
  vi: "Vi",
  warwick: "Warwick",
  yasuo: "Yasuo",
  yone: "Yone",
  yorick: "Yorick",
  zac: "Zac",
  zed: "Zed",
  zeri: "Zeri",
  zoe: "Zoe"
};

const buildCopy = {
  zh: {
    buildHint: "出装按已审核数据展示；新增英雄会在装备复核后补齐。",
    hexHint: "海克斯使用最新版官方图标；新增英雄先按掌盟截图选取率排序。",
    noBuilds: "装备还在复核中，暂不展示未确认出装。"
  },
  en: {
    buildHint: "Reviewed builds are shown first. New champion builds will be added after item review.",
    hexHint: "Hexes use current official icons. New champions start from captured app rankings.",
    noBuilds: "Item builds are still under review."
  },
  ja: {
    buildHint: "確認済みのビルドを表示します。新規チャンピオンの装備は確認後に追加します。",
    hexHint: "ヘクスは最新版の公式アイコンを使用します。",
    noBuilds: "装備は確認中です。"
  },
  ko: {
    buildHint: "검수된 빌드를 먼저 표시합니다. 신규 챔피언 빌드는 장비 확인 후 추가됩니다.",
    hexHint: "증강은 최신 공식 아이콘을 사용합니다.",
    noBuilds: "아이템 빌드는 확인 중입니다."
  }
};

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

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

async function iconPathExists(iconPath) {
  const slashIndex = iconPath.lastIndexOf("/");
  const directory = slashIndex === -1 ? "" : iconPath.slice(0, slashIndex + 1);
  const fileName = slashIndex === -1 ? iconPath : iconPath.slice(slashIndex + 1);
  if (iconDirectoryCache.has(directory)) {
    return iconDirectoryCache.get(directory).has(fileName.toLowerCase());
  }
  const response = await fetch(cdragonAssetBase + directory);
  if (!response.ok) {
    iconDirectoryCache.set(directory, new Set());
    return false;
  }
  const html = await response.text();
  const files = new Set(
    [...html.matchAll(/href="([^"]+\.png)"/gi)].map((match) => decodeURIComponent(match[1]).toLowerCase())
  );
  iconDirectoryCache.set(directory, files);
  return files.has(fileName.toLowerCase());
}

async function officialAugmentIconPath(augment) {
  const original = normalizeIconPath(augment.augmentSmallIconPath);
  const candidates = [];
  if (/_small(?=\.)/i.test(original)) {
    candidates.push(original.replace(/_small(?=\.)/i, "_large"));
    candidates.push(original.replace(/_small(?=\.)/i, ""));
  }
  candidates.push(original);

  for (const candidate of candidates) {
    if (await iconPathExists(candidate)) return candidate;
  }
  return original;
}

function augmentId(augment) {
  return augment.augmentNameId.replace(/^ARAM_/, "");
}

function augmentMaps(augments) {
  const byId = new Map();
  const byName = new Map();
  for (const augment of augments) {
    const id = augmentId(augment);
    if (augment.augmentNameId.startsWith("ARAM_")) byId.set(augment.augmentNameId, augment);
    const existingById = byId.get(id);
    if (!existingById || augment.augmentNameId.startsWith("ARAM_")) byId.set(id, augment);
    if (augment.nameTRA) {
      const existingByName = byName.get(augment.nameTRA);
      if (!existingByName || (!existingByName.augmentNameId.startsWith("ARAM_") && augment.augmentNameId.startsWith("ARAM_"))) {
        byName.set(augment.nameTRA, augment);
      }
    }
  }
  return { byId, byName };
}

function parseRunePickXml(xml) {
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
  const rows = [];
  for (let index = 0; index < texts.length - 1; index += 1) {
    if (/^\d+(?:\.\d+)?%$/.test(texts[index + 1])) {
      rows.push({ name: texts[index], pick: Number.parseFloat(texts[index + 1]) });
    }
  }
  return rows;
}

async function capturedTierRows(slug, tier, zhAugments, localizedById, localizedHexNames) {
  let file = "";
  for (const patchName of capturePatches) {
    const candidate = path.join(rootDir, "captures", "hex-brawl", patchName, slug, `runes-${tier}.xml`);
    if (await exists(candidate)) {
      file = candidate;
      break;
    }
  }
  if (!file) return [];
  const captured = parseRunePickXml(await readFile(file, "utf8"));
  const rows = [];
  const seen = new Set();
  for (const capturedRow of captured.sort((a, b) => b.pick - a.pick)) {
    const augment = zhAugments.byName.get(capturedRow.name);
    if (!augment) continue;
    const id = augmentId(augment);
    if (seen.has(id)) continue;
    seen.add(id);
    for (const [language, map] of Object.entries(localizedById)) {
      localizedHexNames[language][id] = map.get(id)?.nameTRA || map.get(augment.augmentNameId)?.nameTRA || capturedRow.name;
    }
    rows.push({ id, icon: await officialAugmentIconPath(augment), pick: capturedRow.pick });
    if (rows.length >= 8) break;
  }
  return rows;
}

async function refreshExistingHexRows(data, zhAugments, localizedById, localizedHexNames, missing) {
  const nextHexes = {};
  for (const tier of ["silver", "gold", "prismatic"]) {
    const existingRows = data.hexes?.[tier]?.rows || [];
    const rows = [];
    const seen = new Set();
    for (const row of existingRows) {
      const augment = zhAugments.byId.get(row.id);
      if (!augment) {
        missing.push({ slug: data.champion.slug, tier, id: row.id, name: data.localized?.zh?.hexNames?.[row.id] || row.id });
        continue;
      }
      const id = augmentId(augment);
      if (seen.has(id)) continue;
      seen.add(id);
      for (const [language, map] of Object.entries(localizedById)) {
        localizedHexNames[language][id] = map.get(id)?.nameTRA || map.get(augment.augmentNameId)?.nameTRA || row.id;
      }
      rows.push({ id, icon: await officialAugmentIconPath(augment), pick: Number.isFinite(row.pick) ? row.pick : null });
      if (rows.length >= 8) break;
    }
    if (rows.length < 5) {
      const topUpRows = await capturedTierRows(data.champion.slug, tier, zhAugments, localizedById, localizedHexNames);
      for (const topUp of topUpRows) {
        if (seen.has(topUp.id)) continue;
        seen.add(topUp.id);
        rows.push(topUp);
        if (rows.length >= 5) break;
      }
    }
    nextHexes[tier] = { rows };
  }
  return nextHexes;
}

function championDisplay(champion) {
  if (!champion) return "";
  return `${champion.title} ${champion.name}`.trim();
}

function slugFromChampionId(id) {
  const specials = {
    AurelionSol: "aurelion-sol",
    DrMundo: "dr-mundo",
    JarvanIV: "jarvan-iv",
    KSante: "ksante",
    KogMaw: "kogmaw",
    LeeSin: "lee-sin",
    MasterYi: "master-yi",
    MissFortune: "miss-fortune",
    MonkeyKing: "wukong",
    RekSai: "rek-sai",
    Renata: "renata-glasc",
    TahmKench: "tahm-kench",
    TwistedFate: "twisted-fate",
    Velkoz: "velkoz",
    XinZhao: "xin-zhao"
  };
  return specials[id] || id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function buildSlugToChampionId(champions) {
  return new Map(Object.keys(champions).map((id) => [slugFromChampionId(id), id]));
}

async function loadChampionLocales() {
  const locales = {
    zh: "zh_CN",
    en: "en_US",
    ja: "ja_JP",
    ko: "ko_KR"
  };
  const result = {};
  for (const [language, locale] of Object.entries(locales)) {
    const championJson = await fetchJson(`https://ddragon.leagueoflegends.com/cdn/${gameDataVersion}/data/${locale}/champion.json`);
    result[language] = championJson.data;
  }
  return result;
}

function emptyLocalized(championNames) {
  return {
    zh: {
      eyebrow: `海克斯大乱斗 · Patch ${patch}`,
      meta: `${championNames.zh} 海克斯大乱斗数据页。`,
      buildHint: buildCopy.zh.buildHint,
      hexHint: buildCopy.zh.hexHint,
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    },
    en: {
      eyebrow: `Hex Brawl · Patch ${patch}`,
      meta: `${championNames.en} Hex Brawl guide data.`,
      buildHint: buildCopy.en.buildHint,
      hexHint: buildCopy.en.hexHint,
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    },
    ja: {
      eyebrow: `ヘクスブロウル · Patch ${patch}`,
      meta: `${championNames.ja} Hex Brawl guide data.`,
      buildHint: buildCopy.ja.buildHint,
      hexHint: buildCopy.ja.hexHint,
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    },
    ko: {
      eyebrow: `헥스 난투 · Patch ${patch}`,
      meta: `${championNames.ko} Hex Brawl guide data.`,
      buildHint: buildCopy.ko.buildHint,
      hexHint: buildCopy.ko.hexHint,
      builds: {},
      buildTags: {},
      buildScores: {},
      hexNames: {}
    }
  };
}

function normalizeLocalized(data, championNames, localizedHexNames) {
  data.localized = data.localized || emptyLocalized(championNames);
  for (const language of ["zh", "en", "ja", "ko"]) {
    const defaults = emptyLocalized(championNames)[language];
    data.localized[language] = {
      ...defaults,
      ...(data.localized[language] || {}),
      eyebrow: language === "zh" ? `海克斯大乱斗 · Patch ${patch}` : language === "en" ? `Hex Brawl · Patch ${patch}` : defaults.eyebrow,
      buildHint: buildCopy[language].buildHint,
      hexHint: buildCopy[language].hexHint,
      hexNames: localizedHexNames[language]
    };
    data.localized[language].builds = data.localized[language].builds || {};
    data.localized[language].buildTags = data.localized[language].buildTags || {};
    data.localized[language].buildScores = data.localized[language].buildScores || {};
  }
}

async function copyGuideImages() {
  await mkdir(guideTargetDir, { recursive: true });
  if (await exists(previousGuideDir)) {
    for (const file of await readdir(previousGuideDir)) {
      if (file.toLowerCase().endsWith(".jpg")) {
        await copyFile(path.join(previousGuideDir, file), path.join(guideTargetDir, file));
      }
    }
  }
  const copied = [];
  for (const [sourceFile, slug, key] of guideMappings) {
    const source = path.join(guideSourceDir, sourceFile);
    if (!(await exists(source))) continue;
    const target = path.join(guideTargetDir, `${slug}-${key}.jpg`);
    await copyFile(source, target);
    copied.push(`${slug}-${key}`);
  }
  return copied;
}

async function syncDataFiles() {
  const championLocales = await loadChampionLocales();
  const slugToChampionId = buildSlugToChampionId(championLocales.en);
  const augmentsZh = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/cherry-augments.json");
  const augmentsEn = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json");
  const augmentsJa = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ja_jp/v1/cherry-augments.json");
  const augmentsKo = await fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json");
  const zhAugments = augmentMaps(augmentsZh);
  const localizedById = {
    zh: augmentMaps(augmentsZh).byId,
    en: augmentMaps(augmentsEn).byId,
    ja: augmentMaps(augmentsJa).byId,
    ko: augmentMaps(augmentsKo).byId
  };

  const existingSlugs = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, ""));
  const mappedSlugs = guideMappings.map(([, slug]) => slug);
  const captureSlugs = [];
  for (const patchName of capturePatches) {
    const captureDir = path.join(rootDir, "captures", "hex-brawl", patchName);
    if (!(await exists(captureDir))) continue;
    captureSlugs.push(...(await readdir(captureDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name));
  }
  const slugs = [...new Set([...existingSlugs, ...mappedSlugs, ...captureSlugs])].sort();
  const missing = [];
  const written = [];

  await mkdir(dataDir, { recursive: true });
  for (const slug of slugs) {
    const championId = slugToChampionId.get(slug);
    if (!championId) continue;
    const championNames = {
      zh: championDisplay(championLocales.zh[championId]),
      en: championDisplay(championLocales.en[championId]),
      ja: championDisplay(championLocales.ja[championId]),
      ko: championDisplay(championLocales.ko[championId])
    };
    const file = path.join(dataDir, `${slug}.json`);
    const hadData = await exists(file);
    const data = hadData
      ? JSON.parse(await readFile(file, "utf8"))
      : {
          schemaVersion: 3,
          mode: "hex-brawl",
          dataStatus: "captured-hexes",
          champion: { id: championId, slug, names: championNames },
          localized: emptyLocalized(championNames),
          builds: [],
          hexes: {}
        };
    const localizedHexNames = { zh: {}, en: {}, ja: {}, ko: {} };
    data.schemaVersion = 3;
    data.mode = "hex-brawl";
    data.patch = patch;
    data.gameDataVersion = gameDataVersion;
    data.updatedAt = updatedAt;
    data.dataStatus = hadData ? data.dataStatus || "structured-review" : "captured-hexes";
    data.sourceNote = "非 Riot 官方项目；装备来自人工审核数据，海克斯使用官方当前版本图标并结合掌盟截图整理。";
    data.champion = { id: championId, slug, names: championNames };
    data.builds = Array.isArray(data.builds) ? data.builds : [];
    delete data.guideImages;
    delete data.runeScreenshots;

    data.hexes = hadData && data.hexes
      ? await refreshExistingHexRows(data, zhAugments, localizedById, localizedHexNames, missing)
      : {
          silver: { rows: await capturedTierRows(slug, "silver", zhAugments, localizedById, localizedHexNames) },
          gold: { rows: await capturedTierRows(slug, "gold", zhAugments, localizedById, localizedHexNames) },
          prismatic: { rows: await capturedTierRows(slug, "prismatic", zhAugments, localizedById, localizedHexNames) }
        };
    normalizeLocalized(data, championNames, localizedHexNames);
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    written.push(slug);
  }
  return { written, missing };
}

async function syncDetailPages() {
  const samplePath = path.join(championsDir, "brand", "hex-brawl", "index.html");
  let template = await readFile(samplePath, "utf8");
  template = template
    .replace(/const dataUrl = "\.\.\/\.\.\/\.\.\/data\/hex-brawl\/champions\/[^"]+\.json";/, 'const dataUrl = "../../../data/hex-brawl/champions/__SLUG__.json";')
    .replaceAll("16.12.1", gameDataVersion)
    .replaceAll("Patch 16.12", `Patch ${patch}`)
    .replaceAll("16.12/", `${capturePatch}/`);

  const slugs = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
  let count = 0;
  for (const slug of slugs) {
    const pageDir = path.join(championsDir, slug, "hex-brawl");
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), template.replaceAll("__SLUG__", slug), "utf8");
    count += 1;
  }
  return count;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function writeIndex() {
  const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
  const champions = [];
  for (const file of files) {
    const data = JSON.parse(await readFile(path.join(dataDir, file), "utf8"));
    if (!data.champion) continue;
    const hasPlayableData = (data.builds || []).some((build) => (build.items || []).length) ||
      ["silver", "gold", "prismatic"].some((tier) => (data.hexes?.[tier]?.rows || []).length);
    if (!hasPlayableData) continue;
    const names = data.champion.names || {};
    champions.push({
      id: data.champion.id,
      slug: data.champion.slug || file.replace(/\.json$/, ""),
      zh: names.zh || data.champion.id,
      en: names.en || data.champion.id,
      ja: names.ja || names.en || data.champion.id,
      ko: names.ko || names.en || data.champion.id,
      aliases: [data.champion.slug, names.zh, names.en, names.ja, names.ko].filter(Boolean).join(" ")
    });
  }
  champions.sort((a, b) => a.zh.localeCompare(b.zh, "zh-CN"));

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>海克斯大乱斗助手 - Hex Brawl Champion Guide</title>
    <meta name="description" content="海克斯大乱斗英雄出装与海克斯推荐索引。" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #18130f;
        --panel: #221a14;
        --card: #31261d;
        --card-hover: #3a2d22;
        --line: #5b4938;
        --text: #efe6d6;
        --muted: #a9957f;
        --accent: #c5965c;
        --shadow: rgba(0, 0, 0, 0.28);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255,255,255,.012) 1px, transparent 1px),
          var(--bg);
        background-size: 34px 34px, 34px 34px, auto;
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif;
      }
      button, input, select { font: inherit; }
      .shell { width: min(100%, 980px); margin: 0 auto; padding: 18px 18px 44px; }
      .topbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 44px; }
      .mark { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; }
      .mark-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(197,150,92,.12); }
      .language { min-width: 112px; height: 38px; border: 1px solid var(--line); border-radius: 8px; background: #211912; color: var(--text); padding: 0 12px; outline: none; }
      .hero { padding: 52px 0 28px; text-align: center; }
      .title { margin: 0; font-size: clamp(34px, 8vw, 64px); line-height: 1.04; font-weight: 800; letter-spacing: 0; color: #f4ead8; text-shadow: 0 5px 20px rgba(0,0,0,.36); }
      .subtitle { margin: 14px 0 0; color: var(--muted); font-size: 14px; letter-spacing: .28em; text-transform: uppercase; }
      .search-wrap { margin: 28px auto 0; width: min(100%, 720px); position: relative; }
      .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 20px; pointer-events: none; }
      .search { width: 100%; height: 64px; border: 1px solid var(--line); border-radius: 8px; background: rgba(42,33,25,.92); color: var(--text); padding: 0 20px 0 52px; outline: none; box-shadow: 0 18px 38px var(--shadow); font-size: 17px; }
      .search::placeholder { color: #7f6e5c; }
      .search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(197,150,92,.16), 0 18px 38px var(--shadow); }
      .content-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin: 34px 0 16px; padding-top: 22px; border-top: 1px solid rgba(91,73,56,.58); }
      .section-title { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 24px; line-height: 1.2; }
      .section-title::before { content: ""; width: 4px; height: 24px; border-radius: 99px; background: var(--accent); }
      .count { color: var(--muted); font-size: 14px; white-space: nowrap; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 14px; }
      .champion-card { border: 1px solid rgba(91,73,56,.72); border-radius: 8px; background: var(--card); padding: 10px 10px 12px; color: var(--text); text-decoration: none; min-height: 142px; box-shadow: 0 12px 24px rgba(0,0,0,.18); transition: transform 150ms ease, border-color 150ms ease, background 150ms ease; }
      .champion-card:hover, .champion-card:focus-visible { transform: translateY(-2px); border-color: var(--accent); background: var(--card-hover); outline: none; }
      .portrait-frame { display: block; width: 72px; height: 72px; margin: 0 auto 11px; border-radius: 8px; padding: 4px; background: #17110c; border: 1px solid rgba(197,150,92,.42); }
      .portrait { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 5px; }
      .champion-name { display: block; min-height: 38px; color: var(--text); font-weight: 700; font-size: 14px; line-height: 1.25; text-align: center; overflow-wrap: anywhere; }
      .empty { display: none; padding: 34px 18px; border: 1px dashed var(--line); border-radius: 8px; color: var(--muted); text-align: center; }
      .footer { margin-top: 34px; color: #806f5d; font-size: 12px; line-height: 1.7; text-align: center; }
      @media (max-width: 560px) {
        .shell { padding: 14px 14px 34px; }
        .hero { padding-top: 42px; }
        .subtitle { font-size: 12px; letter-spacing: .22em; }
        .search { height: 58px; font-size: 16px; }
        .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .champion-card { min-height: 126px; padding: 8px 6px 10px; }
        .portrait-frame { width: 64px; height: 64px; }
        .champion-name { font-size: 13px; }
        .content-head { align-items: start; flex-direction: column; gap: 8px; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="topbar" aria-label="Page header">
        <div class="mark"><span class="mark-dot" aria-hidden="true"></span><span id="patchLabel">Patch ${patch}</span></div>
        <select id="languageSelect" class="language" aria-label="Language">
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </header>
      <section class="hero" aria-labelledby="pageTitle">
        <h1 id="pageTitle" class="title">海克斯大乱斗助手</h1>
        <p id="subtitle" class="subtitle">Hex Brawl Helper</p>
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input id="searchInput" class="search" type="search" autocomplete="off" placeholder="搜索英雄，例如：亚索、Ashe、Yone..." aria-label="Search champions" />
        </div>
      </section>
      <section aria-labelledby="championSectionTitle">
        <div class="content-head">
          <h2 id="championSectionTitle" class="section-title">英雄图鉴</h2>
          <div id="countLabel" class="count">${champions.length} 位英雄</div>
        </div>
        <div id="championGrid" class="grid"></div>
        <div id="emptyState" class="empty">没有找到英雄</div>
      </section>
      <footer id="footerText" class="footer">非 Riot 官方项目。当前页面用于海克斯大乱斗出装与海克斯数据整理。</footer>
    </main>
    <script>
      const ddragonVersion = ${JSON.stringify(gameDataVersion)};
      const i18n = {
        zh: { title: "海克斯大乱斗助手", subtitle: "Hex Brawl Helper", search: "搜索英雄，例如：亚索、Ashe、Yone...", section: "英雄图鉴", empty: "没有找到英雄", count: (n) => \`\${n} 位英雄\`, patch: "Patch ${patch}", footer: "非 Riot 官方项目。当前页面用于海克斯大乱斗出装与海克斯数据整理。" },
        en: { title: "Hex Brawl Helper", subtitle: "ARAM Hextech Brawl Guide", search: "Search champions, e.g. Yasuo, Ashe, Yone...", section: "Champion Index", empty: "No champions found", count: (n) => \`\${n} champions\`, patch: "Patch ${patch}", footer: "This is an unofficial fan-made guide prototype. It is not endorsed by Riot Games." },
        ja: { title: "ヘクスブロウル助手", subtitle: "Hex Brawl Helper", search: "チャンピオンを検索: Yasuo, Ashe, Yone...", section: "チャンピオン一覧", empty: "チャンピオンが見つかりません", count: (n) => \`\${n} 体\`, patch: "Patch ${patch}", footer: "Riot 非公式のファンプロジェクトです。" },
        ko: { title: "헥스 난투 도우미", subtitle: "Hex Brawl Helper", search: "챔피언 검색: Yasuo, Ashe, Yone...", section: "챔피언 목록", empty: "챔피언을 찾을 수 없습니다", count: (n) => \`\${n} champions\`, patch: "Patch ${patch}", footer: "Riot 공식 프로젝트가 아닌 팬 제작 가이드입니다." }
      };
      const champions = ${JSON.stringify(champions, null, 8)};
      const state = { lang: "zh", query: "" };
      const elements = {
        language: document.getElementById("languageSelect"),
        title: document.getElementById("pageTitle"),
        subtitle: document.getElementById("subtitle"),
        search: document.getElementById("searchInput"),
        section: document.getElementById("championSectionTitle"),
        count: document.getElementById("countLabel"),
        grid: document.getElementById("championGrid"),
        empty: document.getElementById("emptyState"),
        patch: document.getElementById("patchLabel"),
        footer: document.getElementById("footerText")
      };
      function championImage(id) { return \`https://ddragon.leagueoflegends.com/cdn/\${ddragonVersion}/img/champion/\${id}.png\`; }
      function getVisibleChampions() {
        const query = state.query.trim().toLowerCase();
        if (!query) return champions;
        return champions.filter((champion) => [champion.zh, champion.en, champion.ja, champion.ko, champion.aliases].join(" ").toLowerCase().includes(query));
      }
      function renderText() {
        const copy = i18n[state.lang];
        document.documentElement.lang = state.lang === "zh" ? "zh-CN" : state.lang === "ja" ? "ja" : state.lang === "ko" ? "ko" : "en";
        elements.title.textContent = copy.title;
        elements.subtitle.textContent = copy.subtitle;
        elements.search.placeholder = copy.search;
        elements.search.setAttribute("aria-label", copy.search);
        elements.section.textContent = copy.section;
        elements.empty.textContent = copy.empty;
        elements.patch.textContent = copy.patch;
        elements.footer.textContent = copy.footer;
      }
      function renderChampions() {
        const visible = getVisibleChampions();
        elements.count.textContent = i18n[state.lang].count(visible.length);
        elements.empty.style.display = visible.length ? "none" : "block";
        elements.grid.innerHTML = visible.map((champion) => {
          const name = champion[state.lang] || champion.en;
          const href = \`champions/\${champion.slug || slugify(champion.en)}/hex-brawl/\`;
          return \`<a class="champion-card" href="\${href}" aria-label="\${name}"><span class="portrait-frame"><img class="portrait" src="\${championImage(champion.id)}" alt="\${name}" loading="lazy" /></span><span class="champion-name">\${name}</span></a>\`;
        }).join("");
      }
      function render() { renderText(); renderChampions(); }
      elements.language.addEventListener("change", (event) => { state.lang = event.target.value; render(); });
      elements.search.addEventListener("input", (event) => { state.query = event.target.value; renderChampions(); });
      render();
    </script>
  </body>
</html>
`;
  await writeFile(path.join(rootDir, "index.html"), html, "utf8");
  return champions.length;
}

const copiedGuides = await copyGuideImages();
const { written, missing } = await syncDataFiles();
const detailCount = await syncDetailPages();
const indexCount = await writeIndex();

console.log(JSON.stringify({
  patch,
  gameDataVersion,
  copiedGuides: copiedGuides.length,
  dataFiles: written.length,
  detailPages: detailCount,
  indexChampions: indexCount,
  removedOrMissingAugments: missing
}, null, 2));
