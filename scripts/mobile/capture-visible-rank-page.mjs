import { execFile } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { findAllTextBounds, loadConfig, readCurrentUi, sleep, tap } from "./adb.mjs";
import { isRuneDataPage, openRuneDataPageFromHeroDetail, returnToHeroRank } from "./hex-brawl-flow.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(import.meta.dirname, "../..");
const patch = process.argv[2] || "16.12";

const slugExceptions = {
  AurelionSol: "aurelion-sol",
  Chogath: "chogath",
  DrMundo: "dr-mundo",
  JarvanIV: "jarvan-iv",
  Kaisa: "kaisa",
  Khazix: "khazix",
  KSante: "ksante",
  LeeSin: "lee-sin",
  MasterYi: "master-yi",
  MissFortune: "miss-fortune",
  MonkeyKing: "wukong",
  Renata: "renata-glasc",
  TahmKench: "tahm-kench",
  TwistedFate: "twisted-fate",
  Velkoz: "velkoz",
  XinZhao: "xin-zhao"
};

function slugForKey(key) {
  return slugExceptions[key] || key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function captureComplete(slug) {
  const dir = resolve(repoRoot, "captures", "hex-brawl", patch, slug);
  if (!existsSync(dir)) return false;
  return readdirSync(dir).filter((file) => /^runes-.*\.png$/.test(file)).length >= 3;
}

async function captureRuneTiers(slug) {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [resolve(import.meta.dirname, "capture-rune-tiers.mjs"), slug, patch],
    {
      cwd: repoRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    }
  );
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

const championData = await fetch(`https://ddragon.leagueoflegends.com/cdn/16.12.1/data/zh_CN/champion.json`).then((response) => response.json());
const championByName = new Map(
  Object.entries(championData.data).map(([key, champion]) => [
    champion.name,
    { name: champion.name, slug: slugForKey(key) }
  ])
);

const config = await loadConfig();
const initialXml = await readCurrentUi(config);
const candidates = [];

for (const [name, champion] of championByName) {
  if (captureComplete(champion.slug)) continue;
  const bounds = findAllTextBounds(initialXml, name).find(
    (candidate) =>
      candidate.left >= 220 &&
      candidate.left <= 380 &&
      candidate.top >= 300 &&
      candidate.bottom <= config.screen.height - 45
  );
  if (bounds) candidates.push({ ...champion, bounds });
}

candidates.sort((a, b) => a.bounds.top - b.bounds.top);
console.log(`Visible candidates: ${candidates.map((candidate) => `${candidate.name}/${candidate.slug}`).join(", ")}`);

for (const candidate of candidates) {
  if (captureComplete(candidate.slug)) continue;

  const xml = await readCurrentUi(config);
  const bounds = findAllTextBounds(xml, candidate.name).find(
    (item) =>
      item.left >= 220 &&
      item.left <= 380 &&
      item.top >= 300 &&
      item.bottom <= config.screen.height - 45
  );

  if (!bounds) {
    console.log(`Skipped no-longer-visible ${candidate.name} (${candidate.slug})`);
    continue;
  }

  console.log(`\n=== ${candidate.name} (${candidate.slug}) ===`);
  await tap(config, bounds.center[0], bounds.center[1]);
  await sleep(3500);

  let pageXml = await readCurrentUi(config);
  try {
    if (!isRuneDataPage(pageXml)) {
      await openRuneDataPageFromHeroDetail(config);
      pageXml = await readCurrentUi(config);
    }

    if (!isRuneDataPage(pageXml)) throw new Error("Current page is not a hero rune list.");
    await captureRuneTiers(candidate.slug);
  } catch (error) {
    console.error(`Failed ${candidate.name} (${candidate.slug}): ${error.message || error}`);
  }

  try {
    await returnToHeroRank(config);
  } catch (error) {
    console.error(`Could not return after ${candidate.slug}: ${error.message || error}`);
    break;
  }
}
