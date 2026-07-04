import {
  findAllTextBounds,
  launchApp,
  press,
  readCurrentUi,
  sleep,
  swipe,
  tap,
  tapVisibleText
} from "./adb.mjs";

export async function pageHas(config, text) {
  return (await readCurrentUi(config)).includes(`text="${text}"`);
}

export function isRuneDataPage(xml) {
  return (
    xml.includes('text="英雄数据"') &&
    xml.includes('text="符文名"') &&
    !xml.includes('text="资料库"')
  );
}

export function isLibraryPage(xml) {
  return xml.includes('text="资料库"');
}

export async function tapTextOrPoint(config, text, point, waitMs = 1200) {
  const bounds = await tapVisibleText(config, text);
  if (bounds) {
    console.log(`Tapped "${text}" at ${bounds.center.join(",")}`);
  } else if (point) {
    await tap(config, point[0], point[1]);
    console.log(`Tapped fallback for "${text}" at ${point.join(",")}`);
  } else {
    throw new Error(`Cannot find text and no coordinate fallback configured: ${text}`);
  }

  await sleep(waitMs);
}

export async function returnToHome(config) {
  await launchApp(config).catch(() => {});
  await sleep(1500);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const xml = await readCurrentUi(config);
    if (xml.includes('text="海斗3.0"') || xml.includes('text="符文套组"')) return;

    if (xml.includes('text="首页"')) {
      await tap(config, ...config.navigationCoordinates.homeTab);
      await sleep(1200);
      if (await pageHas(config, "海斗3.0")) return;
    }

    await press(config, 4);
    await sleep(1000);
  }

  await tap(config, ...config.navigationCoordinates.homeTab);
  await sleep(1500);
}

export async function openHeroRankFromHome(config) {
  await returnToHome(config);
  await tapTextOrPoint(config, "海斗3.0", config.navigationCoordinates.hexBrawlTab, 1800);
  await tap(config, ...config.navigationCoordinates.hexRankSeeAll);
  console.log(`Tapped Hex rank 查看全部 at ${config.navigationCoordinates.hexRankSeeAll.join(",")}`);
  await sleep(3500);
  await tapTextOrPoint(config, "英雄榜", config.navigationCoordinates.heroRankTab, 2500);
  await tap(config, ...config.navigationCoordinates.heroRankAllRole);
  await sleep(800);
}

export async function returnToHeroRank(config) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const xml = await readCurrentUi(config);
    if (xml.includes('text="海克斯大乱斗"') && xml.includes('text="英雄榜"')) {
      await tapTextOrPoint(config, "英雄榜", config.navigationCoordinates.heroRankTab, 1200);
      await tap(config, ...config.navigationCoordinates.heroRankAllRole);
      await sleep(800);
      return;
    }

    await press(config, 4);
    await sleep(1400);
  }

  throw new Error("Could not return to Hex Brawl hero rank page.");
}

export async function scrollHeroRankToTop(config) {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    await swipe(config, [450, 433], [450, 1417], 450);
    await sleep(320);
  }
}

export async function openHeroDetailFromRank(config, heroName, options = {}) {
  if (options.resetScroll !== false) {
    await scrollHeroRankToTop(config);
  }

  const maxScrollAttempts = options.maxScrollAttempts || 160;
  for (let attempt = 0; attempt < maxScrollAttempts; attempt += 1) {
    const rankXml = await readCurrentUi(config);
    const bounds = findAllTextBounds(rankXml, heroName).find(
      (candidate) =>
        candidate.top >= 300 &&
        candidate.bottom <= config.screen.height - 60 &&
        candidate.left >= 120 &&
        candidate.right <= 650
    );

    if (bounds) {
      await tap(config, bounds.center[0], bounds.center[1]);
      const retryPoint = [Math.max(260, bounds.left - 35), bounds.center[1]];

      for (const point of [null, retryPoint]) {
        if (point) {
          await tap(config, point[0], point[1]);
          console.log(`Retried hero "${heroName}" row at ${point.join(",")}.`);
          await sleep(3500);
        } else {
          console.log(`Opened hero "${heroName}" from rank page.`);
          await sleep(3500);
        }

        const xml = await readCurrentUi(config);
        if (isRuneDataPage(xml)) {
          return;
        }

        if (xml.includes('text="数据"') && xml.includes('text="资料"') && xml.includes('text="攻略"')) {
          return;
        }
      }

      throw new Error(`Tapped "${heroName}", but hero detail page did not load.`);
    }

    await swipe(config, [450, 1417], [450, 433], 550);
    await sleep(1000);
  }

  throw new Error(`Hero not found after scrolling rank page: ${heroName}`);
}

function hasVisibleText(xml, text) {
  return findAllTextBounds(xml, text).length > 0;
}

function findRuneMorePoint(xml, config) {
  const runeLabels = findAllTextBounds(xml, "符文").filter(
    (bounds) => bounds.left <= 140 && bounds.top >= 420
  );
  const moreButtons = findAllTextBounds(xml, "查看更多").filter((bounds) => bounds.left >= 850);

  for (const runeLabel of runeLabels) {
    const runeY = (runeLabel.top + runeLabel.bottom) / 2;
    const matchingButton = moreButtons.find((button) => {
      const buttonY = (button.top + button.bottom) / 2;
      return Math.abs(buttonY - runeY) <= 85;
    });

    if (matchingButton) return matchingButton.center;
  }

  if (runeLabels.length) {
    const runeLabel = runeLabels[0];
    const runeY = Math.round((runeLabel.top + runeLabel.bottom) / 2);
    return [config.screen.width - 77, runeY];
  }

  return null;
}

async function tapRuneMore(config) {
  const xml = await readCurrentUi(config);
  const point = findRuneMorePoint(xml, config);
  if (!point) return false;

  await tap(config, point[0], point[1]);
  console.log(`Tapped rune 查看更多 at ${point.join(",")}`);
  return true;
}

async function moveTowardRuneSection(config, xml) {
  if (hasVisibleText(xml, "推荐装备")) {
    console.log("推荐装备 is visible before 符文 entry; scrolling back up slightly.");
    await swipe(config, [450, 683], [450, 1100], 360);
    await sleep(900);
    return;
  }

  if (hasVisibleText(xml, "最佳拍档")) {
    console.log("最佳拍档 is visible; nudging down to the 符文 section.");
    await swipe(config, [450, 1142], [450, 875], 320);
    await sleep(900);
    return;
  }

  await swipe(config, [450, 1183], [450, 900], 320);
  await sleep(900);
}

export async function openRuneDataPageFromHeroDetail(config) {
  const fallbackPoints = [
    [836, 1017],
    [836, 1085],
    [836, 1230],
    [836, 917]
  ];
  let hasScrolledIntoRuneArea = false;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let xml = await readCurrentUi(config);
    if (isRuneDataPage(xml)) return;

    let tapped = await tapRuneMore(config);
    if (!tapped) {
      if (!hasScrolledIntoRuneArea) {
        console.log("Short-scrolling toward the area below 最佳拍档.");
        await swipe(config, [450, 1208], [450, 858], 360);
        await sleep(1200);
        hasScrolledIntoRuneArea = true;
        continue;
      }

      const point = fallbackPoints[(attempt - 1) % fallbackPoints.length];
      await tap(config, point[0], point[1]);
      console.log(`Tapped rune 查看更多 fallback at ${point.join(",")}`);
      tapped = true;
    }

    await sleep(3500);

    xml = await readCurrentUi(config);
    if (isRuneDataPage(xml)) return;

    if (isLibraryPage(xml)) {
      console.log("Detected 资料库 page after tapping rune more; backing out.");
      await press(config, 4);
      await sleep(1600);
      continue;
    }

    if (xml.includes('text="英雄数据"')) {
      await sleep(1200);
      xml = await readCurrentUi(config);
      if (isRuneDataPage(xml)) return;

      console.log("Detected 英雄数据 page, but not the rune list; backing out.");
      await press(config, 4);
      await sleep(1600);
      continue;
    }

    if (xml.includes('text="海克斯大乱斗"')) {
      console.log("Detected Hex Brawl global page after tapping rune more; backing out.");
      await press(config, 4);
      await sleep(1600);
      continue;
    }

    if (attempt % 3 === 2) {
      await swipe(config, [450, 683], [450, 1042], 320);
      await sleep(800);
    } else {
      await swipe(config, [450, 1100], [450, 883], 300);
      await sleep(800);
    }
  }

  throw new Error("Could not open the single-hero rune data page.");
}
