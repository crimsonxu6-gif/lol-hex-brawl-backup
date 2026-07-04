import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { loadConfig } from "./adb.mjs";
import {
  openHeroDetailFromRank,
  openHeroRankFromHome,
  openRuneDataPageFromHeroDetail,
  returnToHeroRank
} from "./hex-brawl-flow.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(import.meta.dirname, "../..");

const fromCurrentRank = process.argv.includes("--from-current-rank");
const positionals = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const listFile = positionals[0];
const patch = positionals[1] || "16.12";
const startSlug = positionals[2] || "";

if (!listFile) {
  console.error("Usage: node scripts/mobile/capture-list-runes.mjs <list-json> [patch] [start-slug] [--from-current-rank]");
  process.exit(1);
}

const config = await loadConfig();
const champions = JSON.parse(await readFile(resolve(repoRoot, listFile), "utf8"));
const startIndex = startSlug
  ? champions.findIndex((champion) => champion.slug === startSlug)
  : 0;

if (startSlug && startIndex === -1) {
  console.error(`Unknown start slug: ${startSlug}`);
  process.exit(1);
}

async function captureRuneTiers(champion) {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [resolve(import.meta.dirname, "capture-rune-tiers.mjs"), champion.slug, patch],
    {
      cwd: repoRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    }
  );

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

const failures = [];

if (!fromCurrentRank) {
  await openHeroRankFromHome(config);
}

const queue = champions.slice(Math.max(startIndex, 0));

for (const [index, champion] of queue.entries()) {
  console.log(`\n=== ${champion.name} (${champion.slug}) ===`);

  try {
    await openHeroDetailFromRank(config, champion.name, {
      resetScroll: !(fromCurrentRank && index > 0)
    });
    await openRuneDataPageFromHeroDetail(config);
    await captureRuneTiers(champion);
  } catch (error) {
    failures.push(champion);
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    console.error(error.message || error);
    console.error(`Failed ${champion.name} (${champion.slug})`);
  }

  try {
    await returnToHeroRank(config);
  } catch (error) {
    console.error(`Could not return to hero rank after ${champion.slug}: ${error.message || error}`);
    if (!fromCurrentRank) {
      await openHeroRankFromHome(config);
    }
  }
}

if (failures.length) {
  console.error(`\nFailures: ${failures.map((champion) => champion.slug).join(", ")}`);
  process.exit(2);
}
