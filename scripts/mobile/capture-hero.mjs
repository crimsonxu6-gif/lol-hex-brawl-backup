import { dumpUi, loadConfig, resetDirectory, screencap, sleep, swipe } from "./adb.mjs";

const config = await loadConfig();
const heroSlug = process.argv[2];
const patch = process.argv[3] || config.patch;

if (!heroSlug) {
  console.error("Usage: node scripts/mobile/capture-hero.mjs <hero-slug> [patch]");
  process.exit(1);
}

const outputDir = await resetDirectory(`${config.outputRoot}/${patch}/${heroSlug}`);
console.log(`Capturing ${heroSlug} into ${outputDir}`);

for (const step of config.capturePlan) {
  if (step.swipeBefore) {
    await swipe(
      config,
      step.swipeBefore.from,
      step.swipeBefore.to,
      step.swipeBefore.durationMs
    );
    await sleep(1000);
  }

  const imagePath = `${outputDir}/${step.name}.png`;
  const xmlPath = `${outputDir}/${step.name}.xml`;
  await screencap(config, imagePath);
  await dumpUi(config, xmlPath);
  console.log(`Saved ${step.name}`);
}
