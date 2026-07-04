import { loadConfig, readCurrentUi, screencap, sleep, tap, tapVisibleText } from "./adb.mjs";

const config = await loadConfig();
const heroSlug = process.argv[2];
const patch = process.argv[3] || config.patch;

if (!heroSlug) {
  console.error("Usage: node scripts/mobile/capture-rune-tiers.mjs <hero-slug> [patch]");
  process.exit(1);
}

const tiers = [
  ["silver", "白银阶"],
  ["gold", "黄金阶"],
  ["prismatic", "棱彩阶"]
];

const initialXml = await readCurrentUi(config, `captures/hex-brawl/${patch}/${heroSlug}/runes-before.xml`);
if (
  !initialXml.includes('text="英雄数据"') ||
  !initialXml.includes('text="符文名"') ||
  initialXml.includes('text="资料库"')
) {
  console.error("Current page is not the single-hero rune data page. Refusing to capture.");
  process.exit(2);
}

for (const [key, label] of tiers) {
  const bounds = await tapVisibleText(config, label, {
    xmlPath: `captures/hex-brawl/${patch}/${heroSlug}/runes-${key}.xml`
  });

  if (!bounds) {
    const coordinate = config.runeTierCoordinates?.[key];
    if (!coordinate) {
      console.error(`Tier button not found and no fallback coordinate is configured: ${label}`);
      process.exit(2);
    }

    await tap(config, coordinate[0], coordinate[1]);
    console.log(`Tapped ${label} fallback at ${coordinate.join(",")}`);
  }

  await sleep(1200);
  const imagePath = `captures/hex-brawl/${patch}/${heroSlug}/runes-${key}.png`;
  await screencap(config, imagePath);
  console.log(`Saved ${label}: ${imagePath}`);
}
