import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadConfig } from "./adb.mjs";
import {
  openHeroDetailFromRank,
  openHeroRankFromHome,
  openRuneDataPageFromHeroDetail,
  returnToHeroRank
} from "./hex-brawl-flow.mjs";

const execFileAsync = promisify(execFile);
const moduleDir = dirname(fileURLToPath(import.meta.url));
const patch = process.argv[2] || "16.12";
const startSlug = process.argv[3] || "";
const config = await loadConfig();
const champions = JSON.parse(
  await readFile(resolve(moduleDir, "champions-showcase.json"), "utf8")
);

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
    [resolve(moduleDir, "capture-rune-tiers.mjs"), champion.slug, patch],
    {
      cwd: resolve(moduleDir, "../.."),
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    }
  );

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

const failures = [];

await openHeroRankFromHome(config);

for (const champion of champions.slice(Math.max(startIndex, 0))) {
  console.log(`\n=== ${champion.name} (${champion.slug}) ===`);

  try {
    await openHeroDetailFromRank(config, champion.name);
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
    await openHeroRankFromHome(config);
  }
}

if (failures.length) {
  console.error(`\nFailures: ${failures.map((champion) => champion.slug).join(", ")}`);
  process.exit(2);
}
