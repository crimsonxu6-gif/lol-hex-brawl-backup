import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");

const labelByKey = {
  standard: { zh: "常规出装", tag: "常规", en: "Standard Build" },
  tank: { zh: "肉装", tag: "肉装", en: "Tank Build" },
  ap: { zh: "AP 出装", tag: "AP", en: "AP Build" },
  "ap-2": { zh: "AP 出装 2", tag: "AP 2", en: "AP Build 2" },
  "ap-tank": { zh: "AP/肉装", tag: "AP/肉装", en: "AP/Tank Build" },
  bruiser: { zh: "战士出装", tag: "战士", en: "Bruiser Build" },
  crit: { zh: "暴击出装", tag: "暴击", en: "Crit Build" },
  onhit: { zh: "特效出装", tag: "特效", en: "On-hit Build" },
  support: { zh: "辅助出装", tag: "辅助", en: "Support Build" },
  ad: { zh: "AD 出装", tag: "AD", en: "AD Build" },
  "double-tear": { zh: "双女神泪出装", tag: "双女神泪", en: "Double Tear Build" },
  healing: { zh: "治疗出装", tag: "治疗", en: "Healing Build" }
};

const tagByType = {
  tank: "肉装",
  ap: "AP",
  bruiser: "战士",
  crit: "暴击",
  onhit: "特效",
  support: "辅助",
  ad: "AD"
};

function labelFor(build) {
  return labelByKey[build.key] || labelByKey[build.type] || {
    zh: `${build.key || build.type || "custom"} 出装`,
    tag: tagByType[build.type] || build.type || build.key || "出装",
    en: `${build.key || build.type || "Custom"} Build`
  };
}

async function load(slug) {
  const file = path.join(dataDir, `${slug}.json`);
  return { file, data: JSON.parse(await readFile(file, "utf8")) };
}

async function save(file, data) {
  data.updatedAt = "2026-07-03";
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function itemAt(data, key, index, itemId) {
  const build = data.builds?.find((entry) => entry.key === key);
  if (!build || !Array.isArray(build.items)) return false;
  build.items[index] = itemId;
  return true;
}

function setBuild(data, key, type, items) {
  const build = data.builds?.find((entry) => entry.key === key);
  if (!build) return false;
  build.type = type;
  build.items = items;
  return true;
}

function relabelBuilds(data) {
  data.localized = data.localized || {};
  data.localized.zh = data.localized.zh || {};
  data.localized.en = data.localized.en || {};
  data.localized.ja = data.localized.ja || {};
  data.localized.ko = data.localized.ko || {};

  const zhBuilds = {};
  const zhTags = {};
  const zhScores = {};
  const enBuilds = {};
  const enTags = {};
  const enScores = {};
  for (const build of data.builds || []) {
    const label = labelFor(build);
    zhBuilds[build.key] = label.zh;
    zhTags[build.key] = label.tag;
    zhScores[build.key] = "待审核";
    enBuilds[build.key] = label.en;
    enTags[build.key] = label.en.replace(/ Build$/, "");
    enScores[build.key] = "Needs review";
  }
  data.localized.zh.builds = zhBuilds;
  data.localized.zh.buildTags = zhTags;
  data.localized.zh.buildScores = zhScores;
  data.localized.en.builds = enBuilds;
  data.localized.en.buildTags = enTags;
  data.localized.en.buildScores = enScores;
  for (const lang of ["ja", "ko"]) {
    data.localized[lang].builds = { ...enBuilds };
    data.localized[lang].buildTags = { ...enTags };
    data.localized[lang].buildScores = { ...enScores };
  }
}

const changes = [];
function mark(slug, note) {
  changes.push({ slug, note });
}

const directChanges = [
  ["akshan", "crit", 0, 3087, "first item Statikk Shiv"],
  ["aurora", "ap", 4, 3157, "fifth item Zhonya"],
  ["briar", "bruiser", 2, 6698, "third item Profane Hydra"],
  ["chogath", "tank", 4, 4633, "fifth item Riftmaker"],
  ["corki", "crit", 1, 3508, "second item Essence Reaver"],
  ["draven", "crit", 1, 3508, "second item Essence Reaver"],
  ["gangplank", "crit", 0, 3508, "first item Essence Reaver"],
  ["jhin", "crit", 5, 3008, "sixth item Gluttonous Greaves"],
  ["karma", "ap", 4, 4628, "AP fifth item Horizon Focus"],
  ["karma", "support", 4, 6621, "support fifth item Dawncore"],
  ["ksante", "tank", 0, 6662, "first item Iceborn Gauntlet"],
  ["malphite", "tank", 5, 3111, "tank sixth item Mercury Treads"],
  ["mel", "ap", 0, 6655, "first AP item Luden"],
  ["nasus", "bruiser", 4, 3110, "bruiser fifth item Frozen Heart"],
  ["rammus", "tank", 1, 3075, "second item Thornmail"],
  ["rammus", "tank", 3, 3143, "fourth item Randuin"],
  ["renata-glasc", "support", 4, 3109, "fifth item Knight's Vow"],
  ["singed", "ap-tank", 3, 8010, "fourth item Bloodletter's Curse"],
  ["smolder", "crit", 0, 3508, "first item Essence Reaver"],
  ["smolder", "crit", 3, 2523, "fourth item Hexoptics C44"],
  ["sona", "support", 1, 2526, "second item Whispering Circlet"],
  ["tahm-kench", "tank", 5, 3111, "sixth item Mercury Treads"],
  ["varus", "ad", 3, 6695, "second build fourth item Serpent's Fang"],
  ["varus", "onhit", 0, 3087, "on-hit first item Statikk Shiv"],
  ["xin-zhao", "standard", 0, 3087, "first item Statikk Shiv"],
  ["xin-zhao", "standard", 1, 2510, "second item Dusk and Dawn"],
  ["xin-zhao", "standard", 3, 6333, "fourth item Death's Dance"],
  ["xin-zhao", "standard", 4, 3065, "fifth item Spirit Visage"]
];

for (const [slug, key, index, itemId, note] of directChanges) {
  const { file, data } = await load(slug);
  if (itemAt(data, key, index, itemId)) {
    relabelBuilds(data);
    await save(file, data);
    mark(slug, note);
  }
}

{
  const { file, data } = await load("kassadin");
  const build = data.builds?.find((entry) => entry.key === "double-tear");
  if (build) {
    build.items[0] = 6657;
    build.items = build.items.map((id) => id === 6653 ? 4645 : id);
    relabelBuilds(data);
    await save(file, data);
    mark("kassadin", "first item Rod of Ages and mask replaced with Shadowflame");
  }
}

{
  const { file, data } = await load("senna");
  const oldFirst = data.builds?.[0];
  const oldSecond = data.builds?.[1];
  if (oldFirst && oldSecond) {
    const healingItems = [...(oldSecond.items || [])];
    healingItems[1] = 4011;
    data.builds = [
      { ...oldSecond, key: "healing", type: "support", items: healingItems },
      { ...oldFirst, key: "ad", type: "ad" }
    ];
    relabelBuilds(data);
    await save(file, data);
    mark("senna", "first build changed to healing, second item Sword of Blossoming Dawn; AD moved to second");
  }
}

{
  const { file, data } = await load("shyvana");
  if (Array.isArray(data.builds)) {
    data.builds = data.builds.slice(0, 2);
    if (data.builds[0]?.items) data.builds[0].items[4] = 3146;
    relabelBuilds(data);
    await save(file, data);
    mark("shyvana", "removed wrong third build and changed first build fifth item to Hextech Gunblade");
  }
}

{
  const { file, data } = await load("sylas");
  setBuild(data, "ap", "ap", [3100, 4645, 3089, 3135, 3157, 3020]);
  setBuild(data, "bruiser", "bruiser", [3146, 3004, 4633, 3161, 2517, 6333]);
  relabelBuilds(data);
  await save(file, data);
  mark("sylas", "AP and bruiser builds replaced from user notes");
}

{
  const { file, data } = await load("aphelios");
  if (Array.isArray(data.builds)) {
    data.builds = data.builds.filter((build) => build.key !== "ad");
    relabelBuilds(data);
    await save(file, data);
    mark("aphelios", "removed wrong ad build imported from Sylas image");
  }
}

const uncertain = [
  "aphelios: kept crit build only; removed the wrong Sylas-image ad build, but did not infer another second build.",
  "corki: changed second item to Essence Reaver; did not add Draw Your Sword exclusive build without full six-item order.",
  "illaoi: did not add tank second build without full six-item order.",
  "jarvan-iv: did not add damage second build without full six-item order.",
  "jax: did not add AP second build without full six-item order."
];

for (const file of (await readdir(dataDir)).filter((name) => name.endsWith(".json"))) {
  const fullPath = path.join(dataDir, file);
  const data = JSON.parse(await readFile(fullPath, "utf8"));
  const text = JSON.stringify(data.localized?.zh || {});
  if (!text.includes("????")) continue;
  relabelBuilds(data);
  await save(fullPath, data);
  mark(data.champion?.slug || file.replace(/\.json$/, ""), "relabelled question-mark build names");
}

console.log(JSON.stringify({ changes, uncertain }, null, 2));
