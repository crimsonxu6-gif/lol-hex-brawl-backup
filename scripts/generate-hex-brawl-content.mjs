import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patch = "16.12";
const ddragonVersion = "16.12.1";
const guideDir = path.join(rootDir, "assets", "guides", "hex-brawl", patch);
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");

const source = (name) => `C:/Users/徐逸昊/Desktop/tu/${name}`;

const guideChampions = [
  {
    slug: "yasuo",
    id: "Yasuo",
    zh: "疾风剑豪 亚索",
    en: "Yasuo",
    guides: [{ key: "standard", label: "常规暴击", file: "微信图片_20260622161206_397_5.jpg" }]
  },
  {
    slug: "sett",
    id: "Sett",
    zh: "腕豪 瑟提",
    en: "Sett",
    guides: [{ key: "bruiser-tank", label: "战士/肉装", file: "微信图片_20260622161207_398_5.jpg" }]
  },
  {
    slug: "yone",
    id: "Yone",
    zh: "封魔剑魂 永恩",
    en: "Yone",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161208_399_5.jpg" }]
  },
  {
    slug: "garen",
    id: "Garen",
    zh: "德玛西亚之力 盖伦",
    en: "Garen",
    guides: [{ key: "crit", label: "暴击出装", file: "微信图片_20260622161209_400_5.jpg" }]
  },
  {
    slug: "jinx",
    id: "Jinx",
    zh: "暴走萝莉 金克丝",
    en: "Jinx",
    guides: [{ key: "attack-speed", label: "攻速/暴击", file: "微信图片_20260622161210_401_5.jpg" }]
  },
  {
    slug: "ashe",
    id: "Ashe",
    zh: "寒冰射手 艾希",
    en: "Ashe",
    guides: [
      { key: "ap", label: "AP 出装", file: "微信图片_20260622161211_402_5.jpg" },
      { key: "crit-onhit", label: "暴击/特效出装", file: "微信图片_20260622161212_403_5.jpg" }
    ]
  },
  {
    slug: "kaisa",
    id: "Kaisa",
    zh: "虚空之女 卡莎",
    en: "Kai'Sa",
    guides: [
      { key: "onhit", label: "特效/暴击出装", file: "微信图片_20260622161213_404_5.jpg" },
      { key: "ap", label: "AP 出装", file: "微信图片_20260622161214_405_5.jpg" }
    ]
  },
  {
    slug: "vayne",
    id: "Vayne",
    zh: "暗夜猎手 薇恩",
    en: "Vayne",
    guides: [{ key: "standard", label: "常规/爆发出装", file: "微信图片_20260622161214_406_5.jpg" }]
  },
  {
    slug: "zed",
    id: "Zed",
    zh: "影流之主 劫",
    en: "Zed",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161215_407_5.jpg" }]
  },
  {
    slug: "katarina",
    id: "Katarina",
    zh: "不祥之刃 卡特琳娜",
    en: "Katarina",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161216_408_5.jpg" }]
  },
  {
    slug: "master-yi",
    id: "MasterYi",
    zh: "无极剑圣 易",
    en: "Master Yi",
    guides: [{ key: "standard", label: "常规/爆穿出装", file: "微信图片_20260622161217_409_5.jpg" }]
  },
  {
    slug: "lee-sin",
    id: "LeeSin",
    zh: "盲僧 李青",
    en: "Lee Sin",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161218_410_5.jpg" }]
  },
  {
    slug: "lux",
    id: "Lux",
    zh: "光辉女郎 拉克丝",
    en: "Lux",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161219_411_5.jpg" }]
  },
  {
    slug: "ahri",
    id: "Ahri",
    zh: "九尾妖狐 阿狸",
    en: "Ahri",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161220_412_5.jpg" }]
  },
  {
    slug: "ezreal",
    id: "Ezreal",
    zh: "探险家 伊泽瑞尔",
    en: "Ezreal",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161221_413_5.jpg" }]
  },
  {
    slug: "samira",
    id: "Samira",
    zh: "沙漠玫瑰 莎弥拉",
    en: "Samira",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161222_414_5.jpg" }]
  },
  {
    slug: "darius",
    id: "Darius",
    zh: "诺克萨斯之手 德莱厄斯",
    en: "Darius",
    guides: [{ key: "standard", label: "常规/钢门出装", file: "微信图片_20260622161223_415_5.jpg" }]
  },
  {
    slug: "mordekaiser",
    id: "Mordekaiser",
    zh: "铁铠冥魂 莫德凯撒",
    en: "Mordekaiser",
    guides: [{ key: "standard", label: "常规/钢门出装", file: "微信图片_20260622161224_416_5.jpg" }]
  },
  {
    slug: "veigar",
    id: "Veigar",
    zh: "邪恶小法师 维迦",
    en: "Veigar",
    guides: [{ key: "standard", label: "常规出装", file: "微信图片_20260622161225_417_5.jpg" }]
  },
  {
    slug: "kayle",
    id: "Kayle",
    zh: "正义天使 凯尔",
    en: "Kayle",
    guides: [{ key: "hybrid", label: "暴击/AP 出装", file: "微信图片_20260622161226_418_5.jpg" }]
  }
];

const allPageSlugs = ["brand", ...guideChampions.map((champion) => champion.slug)];

function runeScreenshots(slug) {
  return [
    { tier: "silver", label: "白银阶", src: `captures/hex-brawl/${patch}/${slug}/runes-silver.png` },
    { tier: "gold", label: "黄金阶", src: `captures/hex-brawl/${patch}/${slug}/runes-gold.png` },
    { tier: "prismatic", label: "棱彩阶", src: `captures/hex-brawl/${patch}/${slug}/runes-prismatic.png` }
  ];
}

function championData(champion) {
  return {
    schemaVersion: 2,
    mode: "hex-brawl",
    patch,
    gameDataVersion: ddragonVersion,
    updatedAt: "2026-06-22",
    dataStatus: "guide-image-and-captured-runes",
    sourceNote: "装备和海克斯来自用户整理的一图流截图；掌盟符文榜截图来自本机自动化采集，待审核后再结构化为图标数据。",
    champion: {
      id: champion.id,
      slug: champion.slug,
      names: {
        zh: champion.zh,
        en: champion.en,
        ja: champion.en,
        ko: champion.en
      }
    },
    localized: {
      zh: {
        eyebrow: `海克斯大乱斗 · Patch ${patch}`,
        meta: `${champion.zh} 一图流攻略，包含装备、海克斯推荐和掌盟符文榜截图。`,
        guideTitle: "一图流攻略",
        guideHint: "装备和海克斯先以原图入库，便于人工审核。",
        buildHint: "结构化装备待审核后录入；当前请先看一图流攻略。",
        hexHint: "一图流图片包含海克斯推荐；下方符文截图来自掌盟英雄页。",
        builds: {},
        buildTags: {},
        buildScores: {},
        hexNames: {}
      },
      en: {
        eyebrow: `Hex Brawl · Patch ${patch}`,
        meta: `${champion.en} guide images, item builds, hex recommendations, and captured rune ranking screens.`,
        guideTitle: "Guide Images",
        guideHint: "The original guide images are kept intact for review.",
        buildHint: "Structured item builds will be entered after review. Use the guide image first.",
        hexHint: "Hex recommendations are included in the guide image; rune screenshots are captured from the mobile app.",
        builds: {},
        buildTags: {},
        buildScores: {},
        hexNames: {}
      }
    },
    guideImages: champion.guides.map((guide) => ({
      key: guide.key,
      label: guide.label,
      src: `assets/guides/hex-brawl/${patch}/${champion.slug}-${guide.key}.jpg`
    })),
    builds: [],
    hexes: {},
    runeScreenshots: runeScreenshots(champion.slug)
  };
}

const detailTemplate = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>海克斯大乱斗一图流攻略 - Hex Brawl Helper</title>
    <meta name="description" content="海克斯大乱斗英雄出装、海克斯和符文榜截图整理。" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #18130f;
        --panel: #221a14;
        --panel-2: #2b2119;
        --card: #33271d;
        --line: #5b4938;
        --line-soft: rgba(91, 73, 56, 0.45);
        --text: #f0e6d8;
        --muted: #a99681;
        --muted-2: #7d6c5b;
        --accent: #c5965c;
        --accent-2: #d5b17c;
        --silver: #aeb7bb;
        --gold: #d7a94e;
        --prismatic: #c983d8;
        --shadow: rgba(0, 0, 0, 0.28);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        overflow-x: hidden;
        background:
          linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px),
          var(--bg);
        background-size: 34px 34px, 34px 34px, auto;
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      }

      a { color: inherit; }

      .shell {
        width: 100%;
        max-width: 1040px;
        margin: 0 auto;
        padding: 14px 18px 48px;
        overflow-x: hidden;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 42px;
      }

      .back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        text-decoration: none;
        font-size: 14px;
      }

      .language {
        min-width: 112px;
        height: 38px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #211912;
        color: var(--text);
        padding: 0 12px;
        outline: none;
      }

      .hero {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: 16px;
        align-items: center;
        margin-top: 20px;
        padding: 18px;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(197, 150, 92, 0.12), rgba(34, 26, 20, 0.74)), var(--panel);
        box-shadow: 0 18px 42px var(--shadow);
      }

      .champion-icon {
        width: 72px;
        height: 72px;
        border-radius: 8px;
        padding: 4px;
        background: #15100b;
        border: 1px solid rgba(197, 150, 92, 0.55);
      }

      .champion-icon img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        border-radius: 5px;
      }

      .eyebrow {
        color: var(--accent-2);
        font-size: 13px;
        margin-bottom: 5px;
      }

      h1 {
        margin: 0;
        font-size: clamp(28px, 7vw, 44px);
        line-height: 1.08;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .hero-meta {
        margin-top: 9px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }

      .tabs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin: 18px 0;
      }

      .tab {
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: rgba(45, 35, 26, 0.72);
        color: var(--muted);
        text-decoration: none;
        font-weight: 700;
      }

      .tab.active {
        color: var(--text);
        border-color: var(--accent);
        background: rgba(197, 150, 92, 0.14);
      }

      .section {
        margin-top: 16px;
        padding: 18px;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: rgba(34, 26, 20, 0.82);
      }

      .section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 15px;
      }

      h2 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 22px;
        line-height: 1.2;
      }

      h2::before {
        content: "";
        width: 4px;
        height: 22px;
        border-radius: 99px;
        background: var(--accent);
      }

      .hint {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
        text-align: right;
      }

      .guide-grid,
      .rune-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .guide-card,
      .rune-card,
      .build-row,
      .hex-row,
      .empty-card {
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: var(--panel-2);
      }

      .guide-card,
      .rune-card {
        overflow: hidden;
      }

      .guide-label,
      .rune-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 11px 12px;
        color: var(--text);
        font-weight: 800;
      }

      .guide-label span,
      .rune-label span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
      }

      .guide-image,
      .rune-image {
        display: block;
        width: 100%;
        height: auto;
        background: #15100b;
      }

      .build-list,
      .hex-list {
        display: grid;
        gap: 12px;
      }

      .build-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        min-height: 74px;
        padding: 12px;
      }

      .build-name {
        margin-bottom: 9px;
        font-weight: 800;
      }

      .build-note {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
        margin: -4px 0 10px;
        max-width: 720px;
      }

      .items {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .item {
        width: 42px;
        height: 42px;
        border-radius: 7px;
        border: 1px solid rgba(197, 150, 92, 0.42);
        background: #15100b;
        object-fit: cover;
      }

      .stat {
        display: grid;
        gap: 4px;
        min-width: 72px;
        text-align: right;
      }

      .stat small {
        color: var(--muted);
        font-size: 12px;
      }

      .stat strong {
        color: var(--text);
        font-size: 17px;
      }

      .tier-nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 14px;
      }

      .tier-nav a {
        text-align: center;
        text-decoration: none;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        color: var(--muted);
        padding: 10px;
        background: rgba(45, 35, 26, 0.62);
        font-weight: 800;
      }

      .tier-nav a:nth-child(1) { color: var(--silver); }
      .tier-nav a:nth-child(2) { color: var(--gold); }
      .tier-nav a:nth-child(3) { color: var(--prismatic); }

      .hex-group { margin-top: 18px; }
      .hex-group:first-of-type { margin-top: 0; }

      .group-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .group-title h3 {
        margin: 0;
        font-size: 19px;
      }

      .hex-row {
        display: grid;
        grid-template-columns: 48px 1fr 78px;
        gap: 12px;
        align-items: center;
        min-height: 68px;
        padding: 10px 12px;
      }

      .hex-icon {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: block;
        object-fit: cover;
        border: 1px solid rgba(245, 234, 219, 0.18);
        background: #15100b;
      }

      .hex-name {
        font-weight: 800;
        line-height: 1.28;
      }

      .pick {
        color: var(--text);
        text-align: right;
        font-weight: 800;
      }

      .pick small {
        display: block;
        color: var(--muted);
        font-size: 11px;
        font-weight: 500;
      }

      .empty-card {
        padding: 18px;
        color: var(--muted);
        line-height: 1.75;
      }

      .footer {
        margin-top: 26px;
        color: #806f5d;
        font-size: 12px;
        line-height: 1.7;
        text-align: center;
      }

      @media (max-width: 760px) {
        .shell {
          max-width: 430px;
          margin-left: 0;
          margin-right: 0;
          padding: 12px 14px 38px;
        }

        .hero {
          grid-template-columns: 58px 1fr;
          gap: 12px;
          padding: 14px;
        }

        .hero > div:last-child { min-width: 0; }

        h1 {
          font-size: 30px;
          line-height: 1.12;
        }

        .hero-meta,
        .eyebrow { font-size: 12px; }

        .language {
          min-width: 84px;
          width: 84px;
          padding: 0 8px;
        }

        .champion-icon {
          width: 58px;
          height: 58px;
        }

        .tabs {
          gap: 6px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .tab {
          height: 38px;
          font-size: 13px;
          padding: 0 4px;
          min-width: 0;
        }

        .section { padding: 14px; }

        .section-head {
          align-items: start;
          flex-direction: column;
          gap: 6px;
        }

        .hint {
          text-align: left;
        }

        .guide-grid,
        .rune-grid {
          grid-template-columns: 1fr;
        }

        .build-row {
          grid-template-columns: 1fr;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          text-align: left;
        }

        .hex-row {
          grid-template-columns: 42px 1fr 58px;
          gap: 9px;
          padding: 10px;
        }

        .hex-icon {
          width: 40px;
          height: 40px;
        }

        .pick { font-size: 14px; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <a class="back" href="../../../index.html" aria-label="返回首页">← 首页</a>
        <select id="languageSelect" class="language" aria-label="Language">
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </header>

      <section class="hero">
        <div class="champion-icon">
          <img src="https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/Brand.png" alt="" />
        </div>
        <div>
          <div class="eyebrow">海克斯大乱斗 · Patch ${patch}</div>
          <h1>Hex Brawl Helper</h1>
          <div class="hero-meta">加载英雄数据中...</div>
        </div>
      </section>

      <nav class="tabs" aria-label="详情页导航">
        <a id="guideTab" class="tab active" href="#guides">攻略图</a>
        <a id="buildTab" class="tab" href="#builds">出装</a>
        <a id="hexTab" class="tab" href="#hexes">海克斯</a>
        <a id="runeTab" class="tab" href="#runes">符文截图</a>
      </nav>

      <section id="guides" class="section">
        <div class="section-head">
          <h2 id="guideTitle">一图流攻略</h2>
          <div id="guideHint" class="hint">装备和海克斯先以原图入库，便于人工审核。</div>
        </div>
        <div class="guide-grid" id="guideList"></div>
      </section>

      <section id="builds" class="section">
        <div class="section-head">
          <h2 id="buildTitle">常规出装推荐</h2>
          <div id="buildHint" class="hint">先看默认路线，再按局势替换</div>
        </div>
        <div class="build-list" id="buildList"></div>
      </section>

      <section id="hexes" class="section">
        <div class="section-head">
          <h2 id="hexTitle">海克斯推荐</h2>
          <div id="hexHint" class="hint"></div>
        </div>
        <nav class="tier-nav" aria-label="海克斯阶级">
          <a id="silverLink" href="#silver">白银阶</a>
          <a id="goldLink" href="#gold">黄金阶</a>
          <a id="prismaticLink" href="#prismatic">棱彩阶</a>
        </nav>
        <div id="hexGroups"></div>
      </section>

      <section id="runes" class="section">
        <div class="section-head">
          <h2 id="runeTitle">掌盟符文榜截图</h2>
          <div id="runeHint" class="hint">按白银、黄金、棱彩三个阶级截图留档。</div>
        </div>
        <div class="rune-grid" id="runeList"></div>
      </section>

      <footer id="footerText" class="footer">
        非 Riot 官方项目。当前资料用于海克斯大乱斗一图流展示和人工审核。
      </footer>
    </main>

    <script>
      let version = "${ddragonVersion}";
      let championData = null;
      const dataUrl = "../../../data/hex-brawl/champions/__SLUG__.json";
      const cdragonBase = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";
      const initialLang = new URLSearchParams(window.location.search).get("lang");
      const state = { lang: ["zh", "en", "ja", "ko"].includes(initialLang) ? initialLang : "zh" };

      const copy = {
        zh: {
          back: "← 首页",
          guideTab: "攻略图",
          buildTab: "出装",
          hexTab: "海克斯",
          runeTab: "符文截图",
          guideTitle: "一图流攻略",
          guideHint: "装备和海克斯先以原图入库，便于人工审核。",
          buildTitle: "常规出装推荐",
          buildHint: "先看默认路线，再按局势替换",
          hexTitle: "海克斯推荐",
          hexHint: "按阶级整理，结构化数据会在审核后补齐。",
          runeTitle: "掌盟符文榜截图",
          runeHint: "按白银、黄金、棱彩三个阶级截图留档。",
          silver: "白银阶",
          gold: "黄金阶",
          prismatic: "棱彩阶",
          route: "路线",
          score: "评价",
          pickRate: "选取率",
          noGuides: "这个英雄暂时没有一图流攻略图。",
          noBuilds: "结构化装备还未录入，先参考上方一图流攻略图。",
          noHexes: "结构化海克斯还未录入，先参考一图流攻略图和下方掌盟符文截图。",
          footer: "非 Riot 官方项目。当前资料用于海克斯大乱斗一图流展示和人工审核。",
          loadError: "数据文件加载失败。请用本地服务器打开页面。"
        },
        en: {
          back: "← Home",
          guideTab: "Guide",
          buildTab: "Builds",
          hexTab: "Hexes",
          runeTab: "Runes",
          guideTitle: "Guide Images",
          guideHint: "Original guide images are kept intact for review.",
          buildTitle: "Standard Builds",
          buildHint: "Structured item builds will be entered after review.",
          hexTitle: "Hex Recommendations",
          hexHint: "Structured hex data will be completed after review.",
          runeTitle: "Rune Screenshots",
          runeHint: "Captured by tier: silver, gold, and prismatic.",
          silver: "Silver",
          gold: "Gold",
          prismatic: "Prismatic",
          route: "Route",
          score: "Note",
          pickRate: "Pick rate",
          noGuides: "No guide image has been added for this champion yet.",
          noBuilds: "Structured item builds are not entered yet. Use the guide image first.",
          noHexes: "Structured hex data is not entered yet. Use the guide image and rune screenshots first.",
          footer: "Unofficial Riot fan project. Current data is for Hex Brawl guide display and review.",
          loadError: "Failed to load the data file. Open this page through a local server."
        },
        ja: {
          back: "← ホーム",
          guideTab: "画像",
          buildTab: "ビルド",
          hexTab: "ヘックス",
          runeTab: "ルーン",
          guideTitle: "ガイド画像",
          guideHint: "確認用に元画像を保持しています。",
          buildTitle: "標準ビルド",
          buildHint: "構造化ビルドは確認後に追加します。",
          hexTitle: "ヘックス推奨",
          hexHint: "構造化データは確認後に追加します。",
          runeTitle: "ルーン截图",
          runeHint: "シルバー、ゴールド、プリズムの順で保存。",
          silver: "シルバー",
          gold: "ゴールド",
          prismatic: "プリズム",
          route: "ルート",
          score: "評価",
          pickRate: "選択率",
          noGuides: "このチャンピオンのガイド画像はまだありません。",
          noBuilds: "構造化ビルドは未入力です。先にガイド画像を参照してください。",
          noHexes: "構造化ヘックスは未入力です。ガイド画像とルーン截图を参照してください。",
          footer: "Riot 非公式ファンプロジェクトです。",
          loadError: "データファイルを読み込めません。ローカルサーバー経由で開いてください。"
        },
        ko: {
          back: "← 홈",
          guideTab: "가이드",
          buildTab: "빌드",
          hexTab: "헥스",
          runeTab: "룬",
          guideTitle: "가이드 이미지",
          guideHint: "검토를 위해 원본 이미지를 유지합니다.",
          buildTitle: "표준 빌드",
          buildHint: "구조화 빌드는 검토 후 입력합니다.",
          hexTitle: "헥스 추천",
          hexHint: "구조화 헥스 데이터는 검토 후 입력합니다.",
          runeTitle: "룬 스크린샷",
          runeHint: "실버, 골드, 프리즘 순서로 저장했습니다.",
          silver: "실버",
          gold: "골드",
          prismatic: "프리즘",
          route: "경로",
          score: "평가",
          pickRate: "선택률",
          noGuides: "이 챔피언의 가이드 이미지가 아직 없습니다.",
          noBuilds: "구조화 빌드는 아직 입력되지 않았습니다. 먼저 가이드 이미지를 확인하세요.",
          noHexes: "구조화 헥스 데이터는 아직 입력되지 않았습니다. 가이드 이미지와 룬 스크린샷을 확인하세요.",
          footer: "Riot 비공식 팬 프로젝트입니다.",
          loadError: "데이터 파일을 불러오지 못했습니다. 로컬 서버로 페이지를 열어 주세요."
        }
      };

      const elements = {
        language: document.getElementById("languageSelect"),
        back: document.querySelector(".back"),
        eyebrow: document.querySelector(".eyebrow"),
        title: document.querySelector("h1"),
        meta: document.querySelector(".hero-meta"),
        guideTab: document.getElementById("guideTab"),
        buildTab: document.getElementById("buildTab"),
        hexTab: document.getElementById("hexTab"),
        runeTab: document.getElementById("runeTab"),
        guideTitle: document.getElementById("guideTitle"),
        guideHint: document.getElementById("guideHint"),
        buildTitle: document.getElementById("buildTitle"),
        buildHint: document.getElementById("buildHint"),
        hexTitle: document.getElementById("hexTitle"),
        hexHint: document.getElementById("hexHint"),
        runeTitle: document.getElementById("runeTitle"),
        runeHint: document.getElementById("runeHint"),
        silverLink: document.getElementById("silverLink"),
        goldLink: document.getElementById("goldLink"),
        prismaticLink: document.getElementById("prismaticLink"),
        footer: document.getElementById("footerText")
      };

      function t() {
        return copy[state.lang] || copy.zh;
      }

      function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
      }

      function assetPath(src) {
        if (!src) return "";
        if (/^(https?:)?\\/\\//.test(src) || src.startsWith("/") || src.startsWith("../")) return src;
        return "../../../" + src;
      }

      function itemUrl(id) {
        return "https://ddragon.leagueoflegends.com/cdn/" + version + "/img/item/" + id + ".png";
      }

      function championImageUrl(id) {
        return "https://ddragon.leagueoflegends.com/cdn/" + version + "/img/champion/" + id + ".png";
      }

      function hexIcon(path) {
        return cdragonBase + path;
      }

      function localizedData(lang = state.lang) {
        if (!championData) return {};
        return championData.localized?.[lang] || championData.localized?.en || championData.localized?.zh || {};
      }

      function hexNames(lang = state.lang) {
        return Object.assign({}, localizedData("en").hexNames || {}, localizedData(lang).hexNames || {});
      }

      function screenshots() {
        if (championData?.runeScreenshots?.length) return championData.runeScreenshots;
        const slug = championData?.champion?.slug;
        if (!slug) return [];
        return [
          { tier: "silver", label: t().silver, src: "captures/hex-brawl/${patch}/" + slug + "/runes-silver.png" },
          { tier: "gold", label: t().gold, src: "captures/hex-brawl/${patch}/" + slug + "/runes-gold.png" },
          { tier: "prismatic", label: t().prismatic, src: "captures/hex-brawl/${patch}/" + slug + "/runes-prismatic.png" }
        ];
      }

      function renderText() {
        const c = t();
        const dataCopy = localizedData();
        const championName =
          championData?.champion?.names?.[state.lang] ||
          championData?.champion?.names?.en ||
          championData?.champion?.names?.zh ||
          dataCopy.title ||
          "";

        elements.language.value = state.lang;
        document.documentElement.lang =
          state.lang === "zh" ? "zh-CN" : state.lang === "ja" ? "ja" : state.lang === "ko" ? "ko" : "en";
        document.title = championName ? championName + " 海克斯大乱斗攻略 - Hex Brawl Helper" : document.title;
        elements.back.textContent = c.back;
        elements.eyebrow.textContent = dataCopy.eyebrow || ("Hex Brawl · Patch " + (championData?.patch || ""));
        elements.title.textContent = championName;
        elements.meta.textContent = dataCopy.meta || "";
        elements.guideTab.textContent = c.guideTab;
        elements.buildTab.textContent = c.buildTab;
        elements.hexTab.textContent = c.hexTab;
        elements.runeTab.textContent = c.runeTab;
        elements.guideTitle.textContent = dataCopy.guideTitle || c.guideTitle;
        elements.guideHint.textContent = dataCopy.guideHint || c.guideHint;
        elements.buildTitle.textContent = c.buildTitle;
        elements.buildHint.textContent = dataCopy.buildHint || c.buildHint;
        elements.hexTitle.textContent = c.hexTitle;
        elements.hexHint.textContent = dataCopy.hexHint || c.hexHint;
        elements.runeTitle.textContent = c.runeTitle;
        elements.runeHint.textContent = c.runeHint;
        elements.silverLink.textContent = c.silver;
        elements.goldLink.textContent = c.gold;
        elements.prismaticLink.textContent = c.prismatic;
        elements.footer.textContent = championData?.sourceNote || c.footer;

        const championImage = document.querySelector(".champion-icon img");
        if (championData?.champion?.id && championImage) {
          championImage.src = championImageUrl(championData.champion.id);
          championImage.alt = championName;
        }
      }

      function renderGuides() {
        const guides = championData?.guideImages || [];
        const list = document.getElementById("guideList");
        if (!guides.length) {
          list.innerHTML = '<div class="empty-card">' + escapeHtml(t().noGuides) + "</div>";
          return;
        }
        list.innerHTML = guides
          .map(function (guide, index) {
            const label = guide.label || (t().guideTitle + " " + (index + 1));
            return '<article class="guide-card">' +
              '<div class="guide-label">' + escapeHtml(label) + '<span>原图</span></div>' +
              '<img class="guide-image" src="' + assetPath(guide.src) + '" alt="' + escapeHtml(label) + '" loading="lazy" />' +
              "</article>";
          })
          .join("");
      }

      function renderBuilds() {
        const c = t();
        const dataCopy = localizedData();
        const builds = championData?.builds || [];
        const list = document.getElementById("buildList");
        if (!builds.length) {
          list.innerHTML = '<div class="empty-card">' + escapeHtml(c.noBuilds) + "</div>";
          return;
        }
        list.innerHTML = builds
          .map(function (build) {
            const note = dataCopy.buildNotes?.[build.key] || "";
            const items = (build.items || [])
              .map(function (id) {
                return '<img class="item" src="' + itemUrl(id) + '" alt="" loading="lazy" />';
              })
              .join("");
            return '<article class="build-row">' +
              '<div><div class="build-name">' + escapeHtml(dataCopy.builds?.[build.key] || build.key || "") + '</div>' +
              (note ? '<div class="build-note">' + escapeHtml(note) + '</div>' : '') +
              '<div class="items">' + items + '</div></div>' +
              '<div class="stat"><small>' + escapeHtml(c.route) + '</small><strong>' + escapeHtml(dataCopy.buildTags?.[build.key] || "") +
              '</strong><small>' + escapeHtml(c.score) + '</small><strong>' + escapeHtml(dataCopy.buildScores?.[build.key] || "") + '</strong></div>' +
              "</article>";
          })
          .join("");
      }

      function renderHexes() {
        const c = t();
        const names = hexNames();
        const entries = Object.entries(championData?.hexes || {}).filter(function ([, group]) {
          return group?.rows?.length;
        });
        const target = document.getElementById("hexGroups");
        if (!entries.length) {
          target.innerHTML = '<div class="empty-card">' + escapeHtml(c.noHexes) + "</div>";
          return;
        }
        target.innerHTML = entries
          .map(function ([id, group]) {
            const rows = [...group.rows]
              .sort(function (a, b) { return b.pick - a.pick; })
              .map(function (hex) {
                const pick = Number.isFinite(hex.pick) ? hex.pick.toFixed(2) + "%" : "";
                return '<article class="hex-row">' +
                  '<img class="hex-icon" src="' + hexIcon(hex.icon) + '" alt="" loading="lazy" />' +
                  '<div><div class="hex-name">' + escapeHtml(names[hex.id] || hex.id) + '</div></div>' +
                  '<div class="pick">' + pick + '<small>' + escapeHtml(c.pickRate) + '</small></div>' +
                  "</article>";
              })
              .join("");
            return '<div id="' + escapeHtml(id) + '" class="hex-group">' +
              '<div class="group-title"><h3>' + escapeHtml(c[id] || id) + '</h3></div>' +
              '<div class="hex-list">' + rows + '</div></div>';
          })
          .join("");
      }

      function renderRunes() {
        const runes = screenshots();
        const c = t();
        const labelByTier = { silver: c.silver, gold: c.gold, prismatic: c.prismatic };
        const list = document.getElementById("runeList");
        if (!runes.length) {
          list.innerHTML = '<div class="empty-card">' + escapeHtml(c.noHexes) + "</div>";
          return;
        }
        list.innerHTML = runes
          .map(function (shot) {
            const label = shot.label || labelByTier[shot.tier] || shot.tier;
            return '<article class="rune-card" id="rune-' + escapeHtml(shot.tier || label) + '">' +
              '<div class="rune-label">' + escapeHtml(label) + '<span>掌盟截图</span></div>' +
              '<img class="rune-image" src="' + assetPath(shot.src) + '" alt="' + escapeHtml(label) + '" loading="lazy" />' +
              "</article>";
          })
          .join("");
      }

      function render() {
        if (!championData) return;
        renderText();
        renderGuides();
        renderBuilds();
        renderHexes();
        renderRunes();
      }

      elements.language.addEventListener("change", function (event) {
        state.lang = event.target.value;
        render();
      });

      document.querySelectorAll(".tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
          document.querySelectorAll(".tab").forEach(function (item) { item.classList.remove("active"); });
          tab.classList.add("active");
        });
      });

      async function loadChampionData() {
        try {
          const response = await fetch(dataUrl);
          if (!response.ok) throw new Error("HTTP " + response.status);
          championData = await response.json();
          version = championData.gameDataVersion || version;
          render();
        } catch (error) {
          console.error(error);
          elements.footer.textContent = t().loadError;
        }
      }

      loadChampionData();
    </script>
  </body>
</html>
`;

async function copyGuideImages() {
  await mkdir(guideDir, { recursive: true });
  for (const champion of guideChampions) {
    for (const guide of champion.guides) {
      const target = path.join(guideDir, `${champion.slug}-${guide.key}.jpg`);
      await copyFile(source(guide.file), target);
    }
  }
}

async function writeChampionData() {
  await mkdir(dataDir, { recursive: true });
  for (const champion of guideChampions) {
    const file = path.join(dataDir, `${champion.slug}.json`);
    await writeFile(file, `${JSON.stringify(championData(champion), null, 2)}\n`, "utf8");
  }

  const brandFile = path.join(dataDir, "brand.json");
  const brandData = JSON.parse(await readFile(brandFile, "utf8"));
  brandData.runeScreenshots = runeScreenshots("brand");
  brandData.guideImages = brandData.guideImages || [];
  await writeFile(brandFile, `${JSON.stringify(brandData, null, 2)}\n`, "utf8");
}

async function writeDetailPages() {
  for (const slug of allPageSlugs) {
    const pageDir = path.join(rootDir, "champions", slug, "hex-brawl");
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), detailTemplate.replaceAll("__SLUG__", slug), "utf8");
  }
}

await copyGuideImages();
await writeChampionData();
await writeDetailPages();

console.log(`Generated ${guideChampions.length} champion data files, ${allPageSlugs.length} detail pages, and copied guide images to ${path.relative(rootDir, guideDir)}.`);
