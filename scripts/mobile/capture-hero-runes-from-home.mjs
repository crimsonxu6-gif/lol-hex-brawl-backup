import { loadConfig } from "./adb.mjs";
import {
  openHeroDetailFromRank,
  openHeroRankFromHome,
  openRuneDataPageFromHeroDetail
} from "./hex-brawl-flow.mjs";

const config = await loadConfig();
const heroName = process.argv[2];
const heroSlug = process.argv[3];
const patch = process.argv[4] || config.patch;

if (!heroName || !heroSlug) {
  console.error("Usage: node scripts/mobile/capture-hero-runes-from-home.mjs <visible-hero-name> <hero-slug> [patch]");
  process.exit(1);
}

await openHeroRankFromHome(config);
await openHeroDetailFromRank(config, heroName);
await openRuneDataPageFromHeroDetail(config);

process.argv[2] = heroSlug;
process.argv[3] = patch;
await import("./capture-rune-tiers.mjs");
