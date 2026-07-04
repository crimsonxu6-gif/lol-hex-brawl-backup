import { loadConfig, swipe } from "./adb.mjs";

const [x1, y1, x2, y2, duration = 500] = process.argv.slice(2).map(Number);

if (![x1, y1, x2, y2].every(Number.isFinite)) {
  console.error("Usage: node scripts/mobile/swipe.mjs <x1> <y1> <x2> <y2> [durationMs]");
  process.exit(1);
}

await swipe(await loadConfig(), [x1, y1], [x2, y2], Number.isFinite(duration) ? duration : 500);
console.log(`Swiped ${x1},${y1} -> ${x2},${y2}`);
