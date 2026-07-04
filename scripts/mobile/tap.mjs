import { loadConfig, tap } from "./adb.mjs";

const [x, y] = process.argv.slice(2).map(Number);

if (!Number.isFinite(x) || !Number.isFinite(y)) {
  console.error("Usage: node scripts/mobile/tap.mjs <x> <y>");
  process.exit(1);
}

await tap(await loadConfig(), x, y);
console.log(`Tapped ${x},${y}`);
