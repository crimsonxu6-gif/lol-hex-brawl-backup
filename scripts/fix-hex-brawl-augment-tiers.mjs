import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const debugDir = path.join(rootDir, "captures", "debug");
const capturePatches = ["16.13", "16.12"];
const cdragonAssetBase = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";
const iconDirectoryCache = new Map();

const tierOrder = ["silver", "gold", "prismatic"];
const rarityToTier = {
  kSilver: "silver",
  kGold: "gold",
  kPrismatic: "prismatic"
};

const genericTopUps = {
  silver: [
    "Goredrink",
    "Deft",
    "escAPADe",
    "ADAPt",
    "BluntForce",
    "ShadowRunner",
    "OceanSoul",
    "InfernalSoul",
    "Erosion",
    "SlapAround"
  ],
  gold: [
    "ThreadtheNeedle",
    "SoulEater",
    "Executioner",
    "ShrinkRay",
    "BreadAndJam",
    "Recursion",
    "TwiceThrice",
    "PhenomenalEvil",
    "ApexInventor",
    "ItsKillingTime"
  ],
  prismatic: [
    "FinalForm",
    "GiantSlayer",
    "JeweledGauntlet",
    "Dashing",
    "WisdomOfAges",
    "BladeWaltz",
    "BacktoBasics",
    "MadScientist",
    "RaidBoss",
    "SummonersRoulette"
  ]
};

const guideHexOverrides = {
  "xin-zhao": {
    silver: [
      "Zealot",
      "WeightedPopoffs",
      "EscapePlan",
      "Deft",
      "FirstAidKit",
      "Typhoon",
      "LightemUp"
    ],
    gold: [
      "PhenomenalEvil",
      "Marksmage",
      "HolyFire",
      "LightningStrikes",
      "DoubleTap",
      "CriticalHealing",
      "EtherealWeapon",
      "TwiceThrice"
    ],
    prismatic: [
      "MasterofDuality",
      "DualWield",
      "TapDancer",
      "MysticPunch",
      "BacktoBasics",
      "CircleofDeath",
      "ProteinShake",
      "Gash"
    ]
  },
  kassadin: {
    silver: [
      "Goredrink",
      "MindtoMatter",
      "ADAPt",
      "UltimateUnstoppable",
      "SwiftAndSafe",
      "ShadowRunner",
      "OceanSoul"
    ],
    gold: [
      "OutlawsGrit",
      "Overflow",
      "BurstingTeeth",
      "Marksmage",
      "BigBrain",
      "FromBeginningToEnd",
      "WarlockJuicebox",
      "PhenomenalEvil"
    ],
    prismatic: [
      "Eureka",
      "FinalForm",
      "GiantSlayer",
      "Dashing",
      "CantTouchThis",
      "FeyMagic",
      "InfiniteRecursion",
      "Quest_WoogletsWitchcap"
    ]
  },
  sylas: {
    silver: [
      "EscapePlan",
      "Upgrade_ZH",
      "ADAPt",
      "SwiftAndSafe",
      "ShadowRunner",
      "Goredrink",
      "OceanSoul"
    ],
    gold: [
      "WarlockJuicebox",
      "Recursion",
      "Marksmage",
      "FromBeginningToEnd",
      "PhenomenalEvil",
      "BurstingTeeth",
      "OutlawsGrit",
      "BigBrain"
    ],
    prismatic: [
      "Eureka",
      "GiantSlayer",
      "MadScientist",
      "HighRoller",
      "Dashing",
      "BacktoBasics",
      "FinalForm",
      "InfiniteRecursion"
    ]
  }
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function augmentId(augment) {
  return augment.augmentNameId.replace(/^ARAM_/, "");
}

function normalizeIconPath(iconPath) {
  return String(iconPath || "")
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
  if (iconDirectoryCache.has(directory)) return iconDirectoryCache.get(directory).has(fileName.toLowerCase());

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
    if (candidate && await iconPathExists(candidate)) return candidate;
  }
  return original;
}

function mapsById(augments) {
  const byId = new Map();
  const byName = new Map();
  for (const augment of augments) {
    const cleanId = augmentId(augment);
    const oldId = augment.augmentNameId;
    const existing = byId.get(cleanId);
    if (!existing || (!existing.augmentNameId.startsWith("ARAM_") && oldId.startsWith("ARAM_"))) {
      byId.set(cleanId, augment);
    }
    byId.set(oldId, augment);
    if (augment.nameTRA) {
      const existingByName = byName.get(augment.nameTRA);
      if (!existingByName || (!existingByName.augmentNameId.startsWith("ARAM_") && oldId.startsWith("ARAM_"))) {
        byName.set(augment.nameTRA, augment);
      }
    }
  }
  return { byId, byName };
}

function officialTierMaps(augmentsZh, zhById) {
  const byId = new Map();
  const byTier = { silver: [], gold: [], prismatic: [] };
  for (const augment of augmentsZh) {
    const tier = rarityToTier[augment.rarity];
    if (!tier) continue;
    const cleanId = augmentId(augment);
    const preferred = zhById.get(cleanId);
    if (!preferred || preferred.augmentNameId === augment.augmentNameId) {
      byId.set(cleanId, tier);
    }
    byId.set(augment.augmentNameId, tier);
  }
  for (const [id, tier] of byId.entries()) {
    if (!id.startsWith("ARAM_") && byTier[tier] && !byTier[tier].includes(id)) {
      byTier[tier].push(id);
    }
  }
  return { byId, byTier };
}

function visibleTextNodes(xml) {
  const nodes = [];
  for (const match of xml.matchAll(/<node\b[^>]*>/g)) {
    const node = match[0];
    const text = /(?:\btext|\bcontent-desc)="([^"]*)"/.exec(node)?.[1] || "";
    const bounds = /\bbounds="\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]"/.exec(node);
    if (!text || !bounds) continue;
    const [, x1, y1, x2, y2] = bounds.map(Number);
    if (x2 <= x1 || y2 <= y1 || (x2 === 0 && y2 === 0)) continue;
    nodes.push({ text, x1, y1, x2, y2 });
  }
  return nodes;
}

function parseVisibleRunePickXml(xml) {
  const nodes = visibleTextNodes(xml)
    .filter((node) => node.y1 >= 400 && node.y1 <= 1700)
    .sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1);
  const rows = [];
  const percentNodes = nodes.filter((node) => /^\d+(?:\.\d+)?%$/.test(node.text));
  for (const percentNode of percentNodes) {
    const nameNode = nodes
      .filter((node) => node.x1 < percentNode.x1 && Math.abs(node.y1 - percentNode.y1) <= 22 && !/^\d+(?:\.\d+)?%$/.test(node.text))
      .sort((a, b) => Math.abs(a.y1 - percentNode.y1) - Math.abs(b.y1 - percentNode.y1) || b.x1 - a.x1)[0];
    if (!nameNode) continue;
    rows.push({ name: nameNode.text, pick: Number.parseFloat(percentNode.text) });
  }
  return rows;
}

async function readCapturedRows(slug, zhByName) {
  const rows = [];
  const seenCaptureRows = new Set();
  for (const patchName of capturePatches) {
    const captureDir = path.join(rootDir, "captures", "hex-brawl", patchName, slug);
    for (const tab of tierOrder) {
      const file = path.join(captureDir, `runes-${tab}.xml`);
      let xml;
      try {
        xml = await readFile(file, "utf8");
      } catch {
        continue;
      }
      for (const row of parseVisibleRunePickXml(xml)) {
        const augment = zhByName.get(row.name);
        if (!augment) continue;
        const id = augmentId(augment);
        const key = `${id}:${patchName}:${tab}`;
        if (seenCaptureRows.has(key)) continue;
        seenCaptureRows.add(key);
        rows.push({ id, pick: row.pick, source: `capture-${patchName}-${tab}` });
      }
    }
  }
  return rows.sort((a, b) => {
    const aPick = Number.isFinite(a.pick) ? a.pick : -1;
    const bPick = Number.isFinite(b.pick) ? b.pick : -1;
    return bPick - aPick;
  });
}

function collectExistingRows(data) {
  const rows = [];
  for (const shownTier of tierOrder) {
    for (const row of data.hexes?.[shownTier]?.rows || []) {
      rows.push({
        id: row.id,
        pick: Number.isFinite(row.pick) ? row.pick : null,
        shownTier,
        source: `existing-${shownTier}`
      });
    }
  }
  return rows;
}

function addLocalizedName(localizedHexNames, localizedById, augment) {
  const cleanId = augmentId(augment);
  for (const [language, map] of Object.entries(localizedById)) {
    localizedHexNames[language][cleanId] = map.get(cleanId)?.nameTRA || map.get(augment.augmentNameId)?.nameTRA || cleanId;
  }
}

async function rowFor(candidate, officialById, localizedHexNames, localizedById) {
  const augment = officialById.get(candidate.id);
  if (!augment) return null;
  const cleanId = augmentId(augment);
  addLocalizedName(localizedHexNames, localizedById, augment);
  return {
    id: cleanId,
    icon: await officialAugmentIconPath(augment),
    pick: Number.isFinite(candidate.pick) ? candidate.pick : null
  };
}

function mergeCandidate(target, candidate) {
  const current = target.get(candidate.id);
  if (!current) {
    target.set(candidate.id, { ...candidate });
    return "added";
  }
  if (Number.isFinite(candidate.pick) && (!Number.isFinite(current.pick) || candidate.pick > current.pick)) {
    current.pick = candidate.pick;
  }
  if (!current.sources) current.sources = [current.source].filter(Boolean);
  if (candidate.source && !current.sources.includes(candidate.source)) current.sources.push(candidate.source);
  return "duplicate";
}

function sortCandidates(candidates) {
  const sourceRank = (source) => {
    if (String(source).startsWith("guide-override")) return 0;
    if (String(source).startsWith("capture-16.13")) return 1;
    if (String(source).startsWith("existing")) return 2;
    if (String(source).startsWith("capture-16.12")) return 3;
    return 4;
  };
  return candidates.sort((a, b) => {
    const aRank = sourceRank(a.source);
    const bRank = sourceRank(b.source);
    if (aRank !== bRank) return aRank - bRank;
    if (aRank === 0 && (Number.isFinite(a.guideOrder) || Number.isFinite(b.guideOrder))) {
      return (Number.isFinite(a.guideOrder) ? a.guideOrder : 999) - (Number.isFinite(b.guideOrder) ? b.guideOrder : 999);
    }
    const aPick = Number.isFinite(a.pick) ? a.pick : -1;
    const bPick = Number.isFinite(b.pick) ? b.pick : -1;
    if (bPick !== aPick) return bPick - aPick;
    if (Number.isFinite(a.guideOrder) || Number.isFinite(b.guideOrder)) {
      return (Number.isFinite(a.guideOrder) ? a.guideOrder : 999) - (Number.isFinite(b.guideOrder) ? b.guideOrder : 999);
    }
    return a.id.localeCompare(b.id);
  });
}

async function fixData() {
  const [augmentsZh, augmentsEn, augmentsJa, augmentsKo] = await Promise.all([
    fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/cherry-augments.json"),
    fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json"),
    fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ja_jp/v1/cherry-augments.json"),
    fetchJson("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json")
  ]);
  const zhMaps = mapsById(augmentsZh);
  const localizedById = {
    zh: zhMaps.byId,
    en: mapsById(augmentsEn).byId,
    ja: mapsById(augmentsJa).byId,
    ko: mapsById(augmentsKo).byId
  };
  const officialTier = officialTierMaps(augmentsZh, zhMaps.byId);

  const report = {
    generatedAt: new Date().toISOString(),
    files: 0,
    moved: 0,
    removedUnavailable: [],
    duplicates: [],
    topUps: [],
    lowTierCounts: [],
    emptyTierCounts: []
  };

  for (const file of (await readdir(dataDir)).filter((name) => name.endsWith(".json")).sort()) {
    const filePath = path.join(dataDir, file);
    const data = JSON.parse(await readFile(filePath, "utf8"));
    const slug = data.champion?.slug || file.replace(/\.json$/, "");
    const localizedHexNames = { zh: {}, en: {}, ja: {}, ko: {} };
    const byTier = {
      silver: new Map(),
      gold: new Map(),
      prismatic: new Map()
    };
    const guideTierLocks = new Set();

    for (const [guideTier, ids] of Object.entries(guideHexOverrides[slug] || {})) {
      if (ids.length >= 5) guideTierLocks.add(guideTier);
      for (const [index, id] of ids.entries()) {
        const officialShownTier = officialTier.byId.get(id);
        if (!officialShownTier) {
          report.removedUnavailable.push({ slug, shownTier: guideTier, id, source: "guide-override" });
          continue;
        }
        if (officialShownTier !== guideTier) report.moved += 1;
        mergeCandidate(byTier[officialShownTier], {
          id,
          pick: null,
          guideOrder: index,
          source: `guide-override-${guideTier}`
        });
      }
    }

    for (const candidate of collectExistingRows(data)) {
      const officialShownTier = officialTier.byId.get(candidate.id);
      if (!officialShownTier) {
        report.removedUnavailable.push({
          slug,
          shownTier: candidate.shownTier,
          id: candidate.id,
          name: data.localized?.zh?.hexNames?.[candidate.id] || candidate.id
        });
        continue;
      }
      if (guideTierLocks.has(officialShownTier) && !byTier[officialShownTier].has(candidate.id)) continue;
      if (candidate.shownTier && candidate.shownTier !== officialShownTier) report.moved += 1;
      if (mergeCandidate(byTier[officialShownTier], candidate) === "duplicate") {
        report.duplicates.push({ slug, id: candidate.id, tier: officialShownTier, source: candidate.source });
      }
    }

    for (const candidate of await readCapturedRows(slug, zhMaps.byName)) {
      const officialShownTier = officialTier.byId.get(candidate.id);
      if (!officialShownTier) {
        report.removedUnavailable.push({ slug, id: candidate.id, source: candidate.source });
        continue;
      }
      if (guideTierLocks.has(officialShownTier) && !byTier[officialShownTier].has(candidate.id)) continue;
      mergeCandidate(byTier[officialShownTier], candidate);
    }

    const nextHexes = {};
    for (const tier of tierOrder) {
      let sortedCandidates = sortCandidates([...byTier[tier].values()]);
      if (sortedCandidates.length < 5) {
        for (const id of genericTopUps[tier]) {
          if (sortedCandidates.length >= 5) break;
          if (byTier[tier].has(id)) continue;
          if (officialTier.byId.get(id) !== tier || !zhMaps.byId.has(id)) continue;
          const candidate = { id, pick: null, source: "tier-top-up" };
          byTier[tier].set(id, candidate);
          sortedCandidates.push(candidate);
          report.topUps.push({ slug, tier, id });
        }
      }
      sortedCandidates = sortCandidates(sortedCandidates).slice(0, 8);
      nextHexes[tier] = {
        rows: (await Promise.all(sortedCandidates.map((candidate) => rowFor(candidate, zhMaps.byId, localizedHexNames, localizedById)))).filter(Boolean)
      };
      if (nextHexes[tier].rows.length > 0 && nextHexes[tier].rows.length < 5) {
        report.lowTierCounts.push({ slug, tier, count: nextHexes[tier].rows.length });
      }
      if (nextHexes[tier].rows.length === 0) {
        report.emptyTierCounts.push({ slug, tier });
      }
    }

    data.hexes = nextHexes;
    data.localized = data.localized || {};
    for (const language of ["zh", "en", "ja", "ko"]) {
      data.localized[language] = data.localized[language] || {};
      data.localized[language].hexNames = localizedHexNames[language];
    }
    data.updatedAt = "2026-07-03";
    data.sourceNote = "非 Riot 官方项目；海克斯已按当前 CommunityDragon 官方 rarity 重新归位，并剔除当前版本不可用条目。";
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    report.files += 1;
  }

  await mkdir(debugDir, { recursive: true });
  await writeFile(path.join(debugDir, "hex-tier-repair-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

console.log(JSON.stringify(await fixData(), null, 2));
