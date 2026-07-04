# Mobile Capture Automation

This is the internal screenshot layer for collecting Hex Brawl reference images
from the Android emulator.

## Requirements

- LDPlayer is running.
- The app is already logged in.
- `scripts/mobile/config.json` points to the active `adb.exe` and device id.

Current detected defaults:

```text
adbPath: D:/leidian/LDPlayer14/adb.exe
deviceId: emulator-5554
screen: 1080x1920, density 280
appPackage: com.tencent.qt.qtl
appActivity: com.tencent.zone.main.LauncherActivity
```

## Commands

Smoke test:

```powershell
node scripts/mobile/smoke-test.mjs
```

Capture current screen and UI tree:

```powershell
node scripts/mobile/capture-current.mjs
```

Tap a visible text node when Android exposes it:

```powershell
node scripts/mobile/tap-text.mjs 国服榜
```

Tap or swipe by calibrated coordinates:

```powershell
node scripts/mobile/tap.mjs 1030 80
node scripts/mobile/swipe.mjs 540 1580 540 520 550
```

Open the Hex Brawl hero rank page:

```powershell
node scripts/mobile/open-hex-brawl-hero-rank.mjs
```

Capture one hero after you manually open that hero's Hex Brawl data page:

```powershell
node scripts/mobile/capture-hero.mjs brand 16.12
```

Open a visible hero from the rank page and capture it:

```powershell
node scripts/mobile/capture-ranked-hero.mjs 复仇焰魂 brand 16.12
```

Capture the currently open hero rune tier page:

```powershell
node scripts/mobile/capture-rune-tiers.mjs brand 16.12
```

Open from the home page flow and capture rune tiers:

```powershell
node scripts/mobile/capture-hero-runes-from-home.mjs 复仇焰魂 brand 16.12
```

Batch-capture the 21 showcase heroes:

```powershell
node scripts/mobile/capture-showcase-runes.mjs 16.12
```

Resume batch capture from a specific hero slug:

```powershell
node scripts/mobile/capture-showcase-runes.mjs 16.12 ezreal
```

The output goes to:

```text
captures/hex-brawl/{patch}/{hero-slug}/
```

## Workflow

1. Open LDPlayer and 掌上英雄联盟.
2. Keep the app logged in on any page.
3. Run `capture-hero-runes-from-home.mjs` for one hero, or `capture-showcase-runes.mjs` for the homepage showcase list.
4. The script enters 首页 -> 海斗3.0 -> 海克斯榜单 查看全部 -> 英雄榜.
5. For each hero, it opens the hero detail page, scrolls until the `符文` section is visible, taps the `查看更多` on the same row, verifies `英雄数据` + `符文名`, then captures 白银阶/黄金阶/棱彩阶.
6. In batch mode, the script returns to 英雄榜 after each hero and continues from there.
7. Review the saved screenshots.

After this is stable, the next layer can add OCR and icon matching to produce
draft JSON files for `data/hex-brawl/champions/`.

Safety checks:

- Hidden WebView text nodes with zero-size bounds are ignored before tapping.
- `capture-rune-tiers.mjs` refuses to capture unless the current page is the single-hero `英雄数据` rune list.
- If a tap opens `资料库` or the global `海克斯大乱斗` page, the flow backs out instead of saving that screen.
