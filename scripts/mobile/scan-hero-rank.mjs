import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { findAllTextBounds, loadConfig, readCurrentUi, sleep, swipe } from "./adb.mjs";
import { openHeroRankFromHome, scrollHeroRankToTop } from "./hex-brawl-flow.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const fromCurrentRank = process.argv.includes("--from-current-rank");
const version = process.argv[2] || "16.13.1";
const patch = process.argv[3] || "16.13";
const maxSteps = Number(process.argv[4] || 120);

const slugExceptions = {
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

function slugForKey(key) {
  return slugExceptions[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function visibleHeroNameBounds(xml, name, config) {
  return findAllTextBounds(xml, name).find(
    (candidate) =>
      candidate.top >= 260 &&
      candidate.bottom <= config.screen.height - 40 &&
      candidate.left >= 110 &&
      candidate.right <= 700
  );
}

const championData = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion.json`).then((response) => {
  if (!response.ok) throw new Error(`Data Dragon request failed: ${response.status} ${response.statusText}`);
  return response.json();
});

const champions = Object.entries(championData.data).map(([key, champion]) => ({
  id: key,
  name: champion.name,
  alias: champion.title,
  slug: slugForKey(key)
}));

const config = await loadConfig();
if (!fromCurrentRank) {
  await openHeroRankFromHome(config);
}
await scrollHeroRankToTop(config);

const found = new Map();
let idleSteps = 0;

for (let step = 0; step < maxSteps; step += 1) {
  const xml = await readCurrentUi(config);
  let added = 0;

  for (const champion of champions) {
    if (found.has(champion.slug)) continue;
    const bounds = visibleHeroNameBounds(xml, champion.name, config);
    if (!bounds) continue;
    found.set(champion.slug, { ...champion, firstSeenStep: step, bounds });
    added += 1;
  }

  idleSteps = added ? 0 : idleSteps + 1;
  if (idleSteps >= 16) break;

  await swipe(config, [450, 1417], [450, 433], 520);
  await sleep(650);
}

const rows = [...found.values()].sort((a, b) => a.firstSeenStep - b.firstSeenStep || a.bounds.top - b.bounds.top);
const output = {
  version,
  patch,
  scannedAt: new Date().toISOString(),
  count: rows.length,
  rows
};

const outputPath = resolve(repoRoot, "captures", "debug", `hero-rank-visible-${patch}.json`);
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Scanned ${rows.length} visible hero-rank entries.`);
console.log(rows.map((row) => `${row.name}/${row.slug}`).join(", "));
console.log(`Saved ${outputPath}`);
