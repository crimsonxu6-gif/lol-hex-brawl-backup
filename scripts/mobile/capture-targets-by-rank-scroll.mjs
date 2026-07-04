import { execFile } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { findAllTextBounds, loadConfig, readCurrentUi, sleep, swipe, tap } from "./adb.mjs";
import { isRuneDataPage, openHeroRankFromHome, openRuneDataPageFromHeroDetail, returnToHeroRank, scrollHeroRankToTop } from "./hex-brawl-flow.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(import.meta.dirname, "../..");

const fromCurrentRank = process.argv.includes("--from-current-rank");
const positionals = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const listFile = positionals[0];
const patch = positionals[1] || "16.13";
const maxSteps = Number(positionals[2] || 170);

if (!listFile) {
  console.error("Usage: node scripts/mobile/capture-targets-by-rank-scroll.mjs <list-json> [patch] [max-steps] [--from-current-rank]");
  process.exit(1);
}

const config = await loadConfig();
const targets = JSON.parse(await readFile(resolve(repoRoot, listFile), "utf8"));

function captureComplete(slug) {
  const dir = resolve(repoRoot, "captures", "hex-brawl", patch, slug);
  if (!existsSync(dir)) return false;
  return ["silver", "gold", "prismatic"].every(
    (tier) =>
      readdirSync(dir).includes(`runes-${tier}.png`) &&
      readdirSync(dir).includes(`runes-${tier}.xml`)
  );
}

function visibleHeroBounds(xml, name) {
  return findAllTextBounds(xml, name).find(
    (candidate) =>
      candidate.top >= 130 &&
      candidate.bottom <= config.screen.height - 70 &&
      candidate.left >= 180 &&
      candidate.right <= 620
  );
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

if (!fromCurrentRank) {
  await openHeroRankFromHome(config);
}
await scrollHeroRankToTop(config);

const done = new Set(targets.filter((target) => captureComplete(target.slug)).map((target) => target.slug));
const failures = [];
let idleSteps = 0;

for (let step = 0; step < maxSteps && done.size < targets.length; step += 1) {
  const xml = await readCurrentUi(config);
  const visibleTargets = targets
    .filter((target) => !done.has(target.slug))
    .map((target) => ({ ...target, bounds: visibleHeroBounds(xml, target.name) }))
    .filter((target) => target.bounds)
    .sort((a, b) => a.bounds.top - b.bounds.top || a.bounds.left - b.bounds.left);

  if (!visibleTargets.length) {
    idleSteps += 1;
    if (idleSteps >= 28) break;
    await swipe(config, [450, 1417], [450, 433], 520);
    await sleep(700);
    continue;
  }

  idleSteps = 0;
  for (const target of visibleTargets) {
    if (done.has(target.slug) || captureComplete(target.slug)) {
      done.add(target.slug);
      continue;
    }

    let currentXml = await readCurrentUi(config);
    let bounds = visibleHeroBounds(currentXml, target.name);
    if (!bounds) continue;

    console.log(`\n=== ${target.name} (${target.slug}) ===`);
    await tap(config, bounds.center[0], bounds.center[1]);
    await sleep(3500);

    try {
      currentXml = await readCurrentUi(config);
      if (!isRuneDataPage(currentXml)) {
        await openRuneDataPageFromHeroDetail(config);
      }
      await captureRuneTiers(target.slug);
      done.add(target.slug);
      console.log(`Completed ${target.slug}`);
    } catch (error) {
      failures.push(target.slug);
      console.error(`Failed ${target.name} (${target.slug}): ${error.message || error}`);
    }

    try {
      await returnToHeroRank(config);
    } catch (error) {
      console.error(`Could not return after ${target.slug}: ${error.message || error}`);
      await openHeroRankFromHome(config);
      await scrollHeroRankToTop(config);
      break;
    }
  }

  await swipe(config, [450, 1417], [450, 433], 520);
  await sleep(700);
}

const remaining = targets.filter((target) => !captureComplete(target.slug)).map((target) => target.slug);
console.log(JSON.stringify({ completed: targets.length - remaining.length, remaining, failures }, null, 2));

if (remaining.length) process.exit(2);
