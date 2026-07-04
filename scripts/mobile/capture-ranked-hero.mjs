import { loadConfig, press, sleep, tapVisibleText } from "./adb.mjs";
import "./open-hex-brawl-hero-rank.mjs";

const config = await loadConfig();
const heroName = process.argv[2];
const heroSlug = process.argv[3];
const patch = process.argv[4] || config.patch;

if (!heroName || !heroSlug) {
  console.error("Usage: node scripts/mobile/capture-ranked-hero.mjs <visible-hero-name> <hero-slug> [patch]");
  process.exit(1);
}

const bounds = await tapVisibleText(config, heroName);
if (!bounds) {
  console.error(`Hero is not visible on the current rank page: ${heroName}`);
  process.exit(2);
}

console.log(`Opened hero ${heroName}`);
await sleep(4000);

process.argv[2] = heroSlug;
process.argv[3] = patch;
await import("./capture-hero.mjs");

await press(config, 4);
await sleep(1200);
