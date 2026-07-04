import { launchApp, loadConfig, press, readCurrentUi, sleep, tap, tapVisibleText } from "./adb.mjs";

const config = await loadConfig();

async function hasText(text) {
  return (await readCurrentUi(config)).includes(`text="${text}"`);
}

async function tapTextOrCoordinate(text, coordinate) {
  const bounds = await tapVisibleText(config, text);
  if (bounds) {
    console.log(`Tapped "${text}" at ${bounds.center.join(",")}`);
    return true;
  }

  if (coordinate) {
    await tap(config, coordinate[0], coordinate[1]);
    console.log(`Tapped fallback for "${text}" at ${coordinate.join(",")}`);
    return true;
  }

  return false;
}

await launchApp(config);
await sleep(1800);

for (let attempt = 0; attempt < 3; attempt += 1) {
  if (await hasText("国服榜")) break;
  await press(config, 4);
  await sleep(900);
}

await tapTextOrCoordinate("国服榜", [603, 81]);
await sleep(2500);
await tapTextOrCoordinate("海克斯大乱斗", [289, 157]);
await sleep(2500);
await tapTextOrCoordinate("英雄榜", [172, 165]);
await sleep(3000);

console.log("Opened Hex Brawl hero rank page.");
