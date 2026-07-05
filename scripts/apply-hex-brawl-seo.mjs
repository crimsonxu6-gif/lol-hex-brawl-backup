import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const championsDir = path.join(rootDir, "champions");
const siteUrl = "https://lol-hex-brawl.vercel.app";

const roleLabels = {
  mage: "Mage",
  adc: "ADC",
  assassin: "Assassin",
  fighter: "Fighter",
  tank: "Tank",
  support: "Support"
};

const roleSets = {
  adc: new Set("akshan aphelios ashe caitlyn corki draven ezreal jhin jinx kaisa kalista kindred kogmaw lucian miss-fortune quinn samira senna sivir smolder tristana twitch varus vayne xayah zeri yunara".split(" ")),
  assassin: new Set("akali ekko evelynn fizz katarina kayn khazix leblanc naafiri nocturne pyke qiyana rengar shaco talon zed yone yasuo viego".split(" ")),
  mage: new Set("ahri anivia annie aurelion-sol aurora azir brand cassiopeia diana elise fiddlesticks galio gragas gwen heimerdinger hwei karma karthus kassadin kayle kennen lillia lissandra locke lux malzahar maokai mel mordekaiser morgana neeko nidalee nunu orianna rumble ryze seraphine singed sona swain sylas syndra taliyah teemo veigar velkoz vex viktor vladimir xerath ziggs zilean zoe zyra".split(" ")),
  support: new Set("alistar bard blitzcrank braum ivern janna karma leona lulu milio nami nautilus rakan rell renata-glasc senna seraphine sona soraka taric thresh yuumi zilean".split(" ")),
  tank: new Set("alistar amumu blitzcrank braum chogath dr-mundo galio ksante leona malphite maokai nautilus nunu ornn poppy rammus rell sejuani shen sion skarner tahm-kench taric thresh volibear zac".split(" ")),
  fighter: new Set("aatrox ambessa belveth briar camille darius fiora gangplank garen gnar graves hecarim illaoi irelia jarvan-iv jax jayce kled lee-sin master-yi nilah olaf pantheon rek-sai renekton riven sett shyvana trundle tryndamere udyr urgot vi warwick wukong xin-zhao yorick zaahen".split(" "))
};

const specialNames = {
  chogath: "Cho'Gath",
  "dr-mundo": "Dr. Mundo",
  "jarvan-iv": "Jarvan IV",
  khazix: "Kha'Zix",
  kogmaw: "Kog'Maw",
  ksante: "K'Sante",
  leblanc: "LeBlanc",
  "lee-sin": "Lee Sin",
  "master-yi": "Master Yi",
  "miss-fortune": "Miss Fortune",
  monkeyking: "Wukong",
  "rek-sai": "Rek'Sai",
  "renata-glasc": "Renata Glasc",
  "tahm-kench": "Tahm Kench",
  "twisted-fate": "Twisted Fate",
  velkoz: "Vel'Koz",
  "xin-zhao": "Xin Zhao"
};

const guidePages = [
  "/guides/",
  "/guides/mage/",
  "/guides/adc/",
  "/guides/assassin/",
  "/guides/fighter/",
  "/guides/tank/",
  "/guides/support/"
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function titleCaseSlug(slug) {
  return slug.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function championSeoName(slug, data) {
  if (specialNames[slug]) return specialNames[slug];
  const id = data.champion?.id || "";
  if (id && !["MonkeyKing"].includes(id)) {
    const spaced = id.replace(/([a-z])([A-Z])/g, "$1 $2").replace("K Sante", "K'Sante");
    return spaced || titleCaseSlug(slug);
  }
  return titleCaseSlug(slug);
}

function roleFor(slug) {
  for (const role of ["adc", "assassin", "mage", "support", "tank", "fighter"]) {
    if (roleSets[role].has(slug)) return role;
  }
  return "fighter";
}

function visibleZhName(data, fallback) {
  const zh = data.champion?.names?.zh;
  return typeof zh === "string" && zh.trim() ? zh.trim() : fallback;
}

function seoFor(slug, data, related) {
  const name = championSeoName(slug, data);
  const zhName = visibleZhName(data, name);
  const role = roleFor(slug);
  const title = `${name} Hex Brawl Build & Best Augments Guide (2026 Meta)`;
  const description = `Find the best Hex Brawl augments and builds for ${name} in the current meta. Includes tiered recommendations, item paths, and beginner-friendly explanations.`;
  const keywords = [
    `${name.toLowerCase()} hex brawl build`,
    `best ${name.toLowerCase()} augments`,
    `${name.toLowerCase()} item build guide`,
    `${name.toLowerCase()} reroll strategy`,
    `${name.toLowerCase()} beginner guide`,
    "lol hex brawl",
    "hex brawl builds",
    "lol augment guide",
    "league of legends augments",
    `${zhName} 海克斯乱斗 出装`,
    `${zhName} 最佳海克斯推荐`
  ];
  return {
    name,
    zhName,
    role,
    roleLabel: roleLabels[role],
    title,
    zhTitle: `${zhName} 海克斯乱斗 出装与最佳海克斯推荐（回归玩家指南）`,
    description,
    keywords,
    canonical: `${siteUrl}/champions/${slug}/hex-brawl/`,
    related
  };
}

function sanitizeData(data, seo) {
  data.dataStatus = "published";
  data.sourceNote = "非 Riot 官方项目；装备和海克斯数据用于海克斯大乱斗出装与推荐参考。";
  data.seo = seo;

  const localized = data.localized || {};
  for (const [lang, loc] of Object.entries(localized)) {
    if (!loc || typeof loc !== "object") continue;
    if (lang === "zh") {
      loc.meta = `${seo.zhName} 海克斯乱斗出装与最佳海克斯推荐。`;
      loc.buildHint = "按不同玩法整理推荐出装。";
      loc.hexHint = "海克斯使用当前版本图标，并结合一图流与掌盟数据整理。";
      loc.guideHint = "导图仅用于核对装备和海克斯，详情页展示结构化数据。";
      if (loc.buildScores) {
        for (const key of Object.keys(loc.buildScores)) {
          if (/待审核|审核|复核/.test(String(loc.buildScores[key]))) loc.buildScores[key] = "推荐";
        }
      }
    } else if (lang === "en") {
      loc.meta = `${seo.name} Hex Brawl builds and best augment recommendations.`;
      loc.buildHint = "Build routes are organized from guide images and current item data.";
      loc.hexHint = "Augments use current icons and are organized from guide images and app data.";
      loc.guideHint = "Guide images are used only as source material; detail pages show structured data.";
      if (loc.buildScores) {
        for (const key of Object.keys(loc.buildScores)) {
          if (/review/i.test(String(loc.buildScores[key]))) loc.buildScores[key] = "Recommended";
        }
      }
    } else if (lang === "ja") {
      loc.buildHint = "ビルドルートはガイド画像と現在のアイテムデータをもとに整理しています。";
      loc.hexHint = "オーグメントは現在のアイコンとガイド画像をもとに整理しています。";
      loc.guideHint = "ガイド画像は確認用で、詳細ページには構造化データを表示します。";
    } else if (lang === "ko") {
      loc.buildHint = "빌드 경로는 가이드 이미지와 현재 아이템 데이터를 기준으로 정리했습니다.";
      loc.hexHint = "증강은 현재 아이콘과 가이드 이미지를 기준으로 정리했습니다.";
      loc.guideHint = "가이드 이미지는 확인용이며 상세 페이지에는 구조화 데이터를 표시합니다.";
    }
  }
}

function relatedFor(slug, byRole, allSlugs) {
  const role = roleFor(slug);
  const group = byRole[role] || [];
  const source = group.length >= 4 ? group : allSlugs;
  const idx = source.indexOf(slug);
  const picked = [];
  for (let offset = 1; picked.length < 5 && offset < source.length + allSlugs.length; offset += 1) {
    const candidate = source[(Math.max(idx, 0) + offset) % source.length];
    if (candidate && candidate !== slug && !picked.includes(candidate)) picked.push(candidate);
    if (offset >= source.length && picked.length < 3) {
      for (const fill of allSlugs) {
        if (fill !== slug && !picked.includes(fill)) picked.push(fill);
        if (picked.length >= 5) break;
      }
    }
  }
  return picked.slice(0, 5);
}

function championPage(slug, data) {
  const seo = data.seo;
  const safeSlug = escapeAttr(slug);
  const championId = escapeAttr(data.champion?.id || seo.name.replace(/\s+/g, ""));
  const relatedLinks = seo.related.map((item) => (
    `<a href="../../../champions/${escapeAttr(item.slug)}/hex-brawl/">${escapeHtml(item.name)}</a>`
  )).join("");
  const keywordBadges = seo.keywords.slice(0, 10).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: seo.title,
    description: seo.description,
    url: seo.canonical,
    inLanguage: "en",
    about: ["lol hex brawl", "hex brawl builds", `${seo.name} augments`]
  };

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeAttr(seo.description)}" />
    <meta name="keywords" content="${escapeAttr(seo.keywords.join(", "))}" />
    <link rel="canonical" href="${escapeAttr(seo.canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeAttr(seo.title)}" />
    <meta property="og:description" content="${escapeAttr(seo.description)}" />
    <meta property="og:url" content="${escapeAttr(seo.canonical)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeAttr(seo.title)}" />
    <meta name="twitter:description" content="${escapeAttr(seo.description)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
    <style>
      :root {
        color-scheme: dark;
        --bg: #18130f;
        --panel: #221a14;
        --panel-2: #2b2119;
        --line: #5b4938;
        --line-soft: rgba(91, 73, 56, 0.45);
        --text: #f0e6d8;
        --muted: #a99681;
        --accent: #c5965c;
        --accent-2: #d5b17c;
        --shadow: rgba(0, 0, 0, 0.28);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255,255,255,.012) 1px, transparent 1px),
          var(--bg);
        background-size: 34px 34px, 34px 34px, auto;
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      }
      a { color: inherit; }
      .shell { width: 100%; max-width: 1040px; margin: 0 auto; padding: 14px 18px 48px; }
      .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; }
      .top-links { display: flex; gap: 14px; flex-wrap: wrap; }
      .back, .top-links a { display: inline-flex; align-items: center; color: var(--muted); text-decoration: none; font-size: 14px; }
      .language { min-width: 112px; height: 38px; border: 1px solid var(--line); border-radius: 8px; background: #211912; color: var(--text); padding: 0 12px; outline: none; }
      .hero {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: 16px;
        align-items: center;
        margin-top: 20px;
        padding: 18px;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(197,150,92,.12), rgba(34,26,20,.74)), var(--panel);
        box-shadow: 0 18px 42px var(--shadow);
      }
      .champion-icon { width: 72px; height: 72px; border-radius: 8px; padding: 4px; background: #15100b; border: 1px solid rgba(197,150,92,.55); }
      .champion-icon img { width: 100%; height: 100%; display: block; object-fit: cover; border-radius: 5px; }
      .eyebrow { color: var(--accent-2); font-size: 13px; margin-bottom: 5px; }
      h1 { margin: 0; font-size: clamp(28px, 7vw, 44px); line-height: 1.08; letter-spacing: 0; overflow-wrap: anywhere; }
      .hero-meta { margin-top: 9px; color: var(--muted); font-size: 14px; line-height: 1.6; }
      .tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 18px 0; }
      .tab {
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: rgba(45,35,26,.72);
        color: var(--muted);
        text-decoration: none;
        font-weight: 700;
      }
      .tab.active { color: var(--text); border-color: var(--accent); background: rgba(197,150,92,.14); }
      .section { margin-top: 16px; padding: 18px; border: 1px solid var(--line-soft); border-radius: 8px; background: rgba(34,26,20,.82); }
      .section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-bottom: 15px; }
      h2 { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 22px; line-height: 1.2; }
      h2::before { content: ""; width: 4px; height: 22px; border-radius: 99px; background: var(--accent); }
      .hint { color: var(--muted); font-size: 13px; line-height: 1.5; text-align: right; }
      .route-switch { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .route-button {
        min-height: 38px;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        background: rgba(45,35,26,.72);
        color: var(--muted);
        padding: 0 14px;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      .route-button.active { color: var(--text); border-color: var(--accent); background: rgba(197,150,92,.18); }
      .build-row, .hex-row, .empty-card { border: 1px solid var(--line-soft); border-radius: 8px; background: var(--panel-2); }
      .build-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; min-height: 74px; padding: 12px; }
      .build-name { font-size: 17px; font-weight: 900; margin-bottom: 10px; }
      .build-note { color: var(--muted); font-size: 13px; line-height: 1.45; margin: -4px 0 10px; max-width: 720px; }
      .items { display: flex; flex-wrap: wrap; gap: 8px; }
      .item { width: 46px; height: 46px; border-radius: 6px; border: 1px solid rgba(197,150,92,.5); background: #15100b; object-fit: cover; }
      .stat { min-width: 96px; color: var(--muted); text-align: right; line-height: 1.45; }
      .stat small { display: block; font-size: 12px; }
      .stat strong { display: block; color: var(--text); font-size: 14px; }
      .tier-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
      .tier-nav a { display: inline-flex; min-height: 34px; align-items: center; border: 1px solid var(--line-soft); border-radius: 8px; padding: 0 12px; color: var(--muted); text-decoration: none; }
      .hex-group { margin-top: 16px; }
      .group-title h3 { margin: 0 0 10px; color: var(--accent-2); font-size: 18px; }
      .hex-list { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hex-row { display: grid; grid-template-columns: 48px 1fr; gap: 10px; align-items: center; min-height: 64px; padding: 8px; }
      .hex-icon { width: 48px; height: 48px; border-radius: 6px; background: #111; object-fit: cover; }
      .hex-name { font-weight: 800; line-height: 1.35; overflow-wrap: anywhere; }
      .empty-card { padding: 16px; color: var(--muted); }
      .seo-content p { margin: 0 0 12px; color: var(--muted); line-height: 1.65; }
      .seo-links, .keyword-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .seo-links a, .keyword-list span {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        padding: 0 11px;
        background: rgba(45,35,26,.72);
        color: var(--text);
        text-decoration: none;
        font-size: 13px;
      }
      .keyword-list { margin-top: 12px; }
      .footer { margin-top: 26px; color: var(--muted); font-size: 12px; line-height: 1.6; text-align: center; }
      @media (max-width: 720px) {
        .shell { padding-inline: 12px; }
        .topbar { align-items: flex-start; flex-direction: column; }
        .hero { grid-template-columns: 58px 1fr; padding: 14px; gap: 12px; }
        .champion-icon { width: 58px; height: 58px; }
        .section { padding: 14px; }
        .section-head { align-items: start; flex-direction: column; gap: 8px; }
        .hint { text-align: left; }
        .build-row { grid-template-columns: 1fr; }
        .stat { text-align: left; display: flex; gap: 8px; flex-wrap: wrap; }
        .hex-list { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <div class="top-links">
          <a class="back" href="../../../index.html">返回首页</a>
          <a href="../../../tier-list/">Tier List</a>
          <a href="../../../meta/">Meta</a>
        </div>
        <select id="languageSelect" class="language" aria-label="Language">
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </header>

      <section class="hero">
        <div class="champion-icon">
          <img src="https://ddragon.leagueoflegends.com/cdn/16.13.1/img/champion/${championId}.png" alt="${escapeAttr(seo.name)}" />
        </div>
        <div>
          <div class="eyebrow">Hex Brawl · Patch 16.13</div>
          <h1>${escapeHtml(seo.zhName)}</h1>
          <div class="hero-meta">${escapeHtml(seo.description)}</div>
        </div>
      </section>

      <nav class="tabs" aria-label="详情页导航">
        <a id="buildTab" class="tab active" href="#builds">出装</a>
        <a id="hexTab" class="tab" href="#hexes">海克斯</a>
      </nav>

      <section id="builds" class="section">
        <div class="section-head">
          <h2 id="buildTitle">出装路线</h2>
          <div id="buildHint" class="hint">按不同玩法整理推荐出装。</div>
        </div>
        <div class="route-switch" id="routeSwitch"></div>
        <div id="buildList"></div>
      </section>

      <section id="hexes" class="section">
        <div class="section-head">
          <h2 id="hexTitle">海克斯推荐</h2>
          <div id="hexHint" class="hint">按白银、黄金、棱彩阶展示推荐海克斯。</div>
        </div>
        <nav class="tier-nav" aria-label="海克斯阶级">
          <a id="silverLink" href="#silver">白银阶</a>
          <a id="goldLink" href="#gold">黄金阶</a>
          <a id="prismaticLink" href="#prismatic">棱彩阶</a>
        </nav>
        <div id="hexGroups"></div>
      </section>

      <section class="section seo-content" aria-label="Hex Brawl guide links">
        <div class="section-head">
          <h2>${escapeHtml(seo.name)} Hex Brawl Guide</h2>
          <div class="hint">${escapeHtml(seo.roleLabel)} champion guide</div>
        </div>
        <p>${escapeHtml(seo.description)} This page targets ${escapeHtml(seo.keywords.slice(0, 5).join(", "))}.</p>
        <div class="seo-links">
          ${relatedLinks}
          <a href="../../../guides/${escapeAttr(seo.role)}/">${escapeHtml(seo.roleLabel)} Hex Brawl builds</a>
          <a href="../../../guides/">Hex Brawl guide hub</a>
        </div>
        <div class="keyword-list">${keywordBadges}</div>
      </section>

      <footer id="footerText" class="footer">非 Riot 官方项目；装备和海克斯数据用于海克斯大乱斗出装与推荐参考。</footer>
    </main>

    <script>
      let version = "16.13.1";
      let championData = null;
      const dataUrl = "../../../data/hex-brawl/champions/${safeSlug}.json";
      const cdragonBase = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";
      const initialLang = new URLSearchParams(window.location.search).get("lang");
      const state = {
        lang: ["zh", "en", "ja", "ko"].includes(initialLang) ? initialLang : "zh",
        selectedBuild: null
      };

      const copy = {
        zh: {
          back: "返回首页", buildTab: "出装", hexTab: "海克斯",
          buildTitle: "出装路线", buildHint: "按不同玩法整理推荐出装。",
          hexTitle: "海克斯推荐", hexHint: "按白银、黄金、棱彩阶展示推荐海克斯。",
          silver: "白银阶", gold: "黄金阶", prismatic: "棱彩阶",
          route: "路线", score: "评价", noBuilds: "这个英雄的结构化出装还没有录入。", noHexes: "没有可展示的海克斯数据。",
          footer: "非 Riot 官方项目；装备和海克斯数据用于海克斯大乱斗出装与推荐参考。", loadError: "数据文件加载失败，请用本地服务器打开页面。"
        },
        en: {
          back: "Home", buildTab: "Builds", hexTab: "Augments",
          buildTitle: "Build Routes", buildHint: "Build routes are organized from guide images and current item data.",
          hexTitle: "Best Augments", hexHint: "Recommendations are grouped by Silver, Gold, and Prismatic tiers.",
          silver: "Silver", gold: "Gold", prismatic: "Prismatic",
          route: "Route", score: "Note", noBuilds: "Structured item builds are not entered yet.", noHexes: "No augment data is available yet.",
          footer: "Unofficial Riot fan project. Item and augment data is provided for Hex Brawl build reference.", loadError: "Failed to load the data file. Open this page through a local server."
        },
        ja: {
          back: "ホーム", buildTab: "ビルド", hexTab: "オーグメント",
          buildTitle: "ビルドルート", buildHint: "ビルドルートはガイド画像と現在のアイテムデータをもとに整理しています。",
          hexTitle: "おすすめオーグメント", hexHint: "シルバー、ゴールド、プリズムの順に表示します。",
          silver: "シルバー", gold: "ゴールド", prismatic: "プリズム",
          route: "ルート", score: "評価", noBuilds: "構造化されたビルドはまだありません。", noHexes: "表示できるオーグメントデータがありません。",
          footer: "Riot 非公式ファンプロジェクトです。", loadError: "データファイルを読み込めませんでした。"
        },
        ko: {
          back: "홈", buildTab: "빌드", hexTab: "증강",
          buildTitle: "빌드 경로", buildHint: "빌드 경로는 가이드 이미지와 현재 아이템 데이터를 기준으로 정리했습니다.",
          hexTitle: "추천 증강", hexHint: "실버, 골드, 프리즘 단계별로 표시합니다.",
          silver: "실버", gold: "골드", prismatic: "프리즘",
          route: "경로", score: "평가", noBuilds: "구조화된 빌드가 아직 없습니다.", noHexes: "표시할 증강 데이터가 없습니다.",
          footer: "Riot 비공식 팬 프로젝트입니다.", loadError: "데이터 파일을 불러오지 못했습니다."
        }
      };

      const elements = {
        language: document.getElementById("languageSelect"),
        back: document.querySelector(".back"),
        eyebrow: document.querySelector(".eyebrow"),
        title: document.querySelector("h1"),
        meta: document.querySelector(".hero-meta"),
        buildTab: document.getElementById("buildTab"),
        hexTab: document.getElementById("hexTab"),
        buildTitle: document.getElementById("buildTitle"),
        buildHint: document.getElementById("buildHint"),
        routeSwitch: document.getElementById("routeSwitch"),
        buildList: document.getElementById("buildList"),
        hexTitle: document.getElementById("hexTitle"),
        hexHint: document.getElementById("hexHint"),
        silverLink: document.getElementById("silverLink"),
        goldLink: document.getElementById("goldLink"),
        prismaticLink: document.getElementById("prismaticLink"),
        hexGroups: document.getElementById("hexGroups"),
        footer: document.getElementById("footerText")
      };

      function t() { return copy[state.lang] || copy.zh; }
      function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
      }
      function itemUrl(id) { return "https://ddragon.leagueoflegends.com/cdn/" + version + "/img/item/" + id + ".png"; }
      function championImageUrl(id) { return "https://ddragon.leagueoflegends.com/cdn/" + version + "/img/champion/" + id + ".png"; }
      function hexIcon(hex) { return hex.icon ? cdragonBase + hex.icon : ""; }
      function localizedData(lang = state.lang) {
        if (!championData) return {};
        return championData.localized?.[lang] || championData.localized?.en || championData.localized?.zh || {};
      }
      function buildLabel(build, field) {
        const dataCopy = localizedData();
        const english = localizedData("en");
        if (field === "note") {
          return dataCopy?.buildNotes?.[build.key] || english?.buildNotes?.[build.key] || build.note || "";
        }
        const table = field === "name" ? "builds" : field === "tag" ? "buildTags" : "buildScores";
        return dataCopy?.[table]?.[build.key] || english?.[table]?.[build.key] || build[field] || build.key || "";
      }
      function hexNames(lang = state.lang) {
        return Object.assign({}, localizedData("en").hexNames || {}, localizedData(lang).hexNames || {});
      }
      function builds() { return Array.isArray(championData?.builds) ? championData.builds : []; }
      function selectedBuild() {
        const list = builds();
        if (!list.length) return null;
        return list.find((build) => build.key === state.selectedBuild) || list[0];
      }
      function selectedHexes() {
        const build = selectedBuild();
        return build?.hexes || championData?.hexes || {};
      }
      function renderText() {
        const c = t();
        const dataCopy = localizedData();
        const championName = championData?.champion?.names?.[state.lang] || championData?.seo?.name || "";
        elements.language.value = state.lang;
        document.documentElement.lang = state.lang === "zh" ? "zh-CN" : state.lang === "ja" ? "ja" : state.lang === "ko" ? "ko" : "en";
        document.title = championData?.seo?.title || (championName + " Hex Brawl Build & Best Augments Guide (2026 Meta)");
        elements.back.textContent = c.back;
        elements.eyebrow.textContent = dataCopy.eyebrow || ("Hex Brawl · Patch " + (championData?.patch || ""));
        elements.title.textContent = championName;
        elements.meta.textContent = state.lang === "en" ? (championData?.seo?.description || dataCopy.meta || "") : (dataCopy.meta || championData?.seo?.description || "");
        elements.buildTab.textContent = c.buildTab;
        elements.hexTab.textContent = c.hexTab;
        elements.buildTitle.textContent = c.buildTitle;
        elements.buildHint.textContent = dataCopy.buildHint || c.buildHint;
        elements.hexTitle.textContent = c.hexTitle;
        elements.hexHint.textContent = dataCopy.hexHint || c.hexHint;
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
      function renderRouteSwitch() {
        const list = builds();
        if (list.length <= 1) {
          elements.routeSwitch.innerHTML = "";
          return;
        }
        elements.routeSwitch.innerHTML = list.map((build) => {
          const active = build.key === selectedBuild()?.key ? " active" : "";
          return '<button class="route-button' + active + '" type="button" data-build="' + escapeHtml(build.key) + '">' + escapeHtml(buildLabel(build, "name")) + '</button>';
        }).join("");
        elements.routeSwitch.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            state.selectedBuild = button.dataset.build;
            renderBuilds();
            renderHexes();
          });
        });
      }
      function renderBuilds() {
        const c = t();
        renderRouteSwitch();
        const build = selectedBuild();
        if (!build) {
          elements.buildList.innerHTML = '<div class="empty-card">' + escapeHtml(c.noBuilds) + '</div>';
          return;
        }
        const items = (build.items || []).map((id) => '<img class="item" src="' + itemUrl(id) + '" alt="" loading="lazy" />').join("");
        const note = buildLabel(build, "note");
        elements.buildList.innerHTML = '<article class="build-row">' +
          '<div><div class="build-name">' + escapeHtml(buildLabel(build, "name")) + '</div>' +
          (note ? '<div class="build-note">' + escapeHtml(note) + '</div>' : '') +
          '<div class="items">' + items + '</div></div>' +
          '<div class="stat"><small>' + escapeHtml(c.route) + '</small><strong>' + escapeHtml(buildLabel(build, "tag")) + '</strong><small>' + escapeHtml(c.score) + '</small><strong>' + escapeHtml(buildLabel(build, "score")) + '</strong></div>' +
          '</article>';
      }
      function renderHexes() {
        const c = t();
        const names = hexNames();
        const entries = Object.entries(selectedHexes()).filter(function ([, group]) { return group?.rows?.length; });
        if (!entries.length) {
          elements.hexGroups.innerHTML = '<div class="empty-card">' + escapeHtml(c.noHexes) + "</div>";
          return;
        }
        elements.hexGroups.innerHTML = entries.map(function ([id, group]) {
          const rows = [...group.rows].sort(function (a, b) { return (b.pick || 0) - (a.pick || 0); }).map(function (hex) {
            const src = hexIcon(hex);
            return '<article class="hex-row">' +
              (src ? '<img class="hex-icon" src="' + src + '" alt="" loading="lazy" />' : '<div class="hex-icon" aria-hidden="true"></div>') +
              '<div><div class="hex-name">' + escapeHtml(names[hex.id] || hex.id) + '</div></div>' +
              "</article>";
          }).join("");
          return '<div id="' + escapeHtml(id) + '" class="hex-group">' +
            '<div class="group-title"><h3>' + escapeHtml(c[id] || id) + '</h3></div>' +
            '<div class="hex-list">' + rows + '</div></div>';
        }).join("");
      }
      function render() {
        if (!championData) return;
        renderText();
        if (!state.selectedBuild && builds().length) state.selectedBuild = builds()[0].key;
        renderBuilds();
        renderHexes();
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
}

function simplePage({ title, description, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <style>
      body { margin: 0; background: #18130f; color: #f0e6d8; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { max-width: 1040px; margin: 0 auto; padding: 28px 18px 56px; }
      a { color: #f0e6d8; text-decoration: none; }
      .back { color: #a99681; }
      h1 { font-size: clamp(32px, 6vw, 54px); margin: 28px 0 10px; letter-spacing: 0; }
      p { color: #a99681; line-height: 1.7; max-width: 760px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; margin-top: 22px; }
      .card { border: 1px solid rgba(91,73,56,.55); border-radius: 8px; background: #221a14; padding: 14px; }
      .meta { color: #d5b17c; font-size: 13px; margin-top: 6px; }
    </style>
  </head>
  <body>
    <main>
      <a class="back" href="../index.html">Home</a>
      ${body}
    </main>
  </body>
</html>
`;
}

async function writeStaticPages(champions) {
  const championCards = champions.map(({ slug, seo }) => (
    `<a class="card" href="../champions/${escapeAttr(slug)}/hex-brawl/"><strong>${escapeHtml(seo.name)}</strong><div class="meta">${escapeHtml(seo.roleLabel)} · Hex Brawl Build</div></a>`
  )).join("");
  await mkdir(path.join(rootDir, "guides"), { recursive: true });
  await writeFile(path.join(rootDir, "guides", "index.html"), simplePage({
    title: "Hex Brawl Builds and League of Legends Augments Guide",
    description: "Browse Hex Brawl builds, augment guides, and champion item paths for the current meta.",
    body: `<h1>Hex Brawl Guide Hub</h1><p>Use this hub for lol hex brawl, hex brawl builds, lol augment guide, and league of legends augments pages. Pick a champion or a class guide to continue.</p><div class="grid">${championCards}</div>`
  }), "utf8");

  for (const role of Object.keys(roleLabels)) {
    const roleChampions = champions.filter((entry) => entry.seo.role === role);
    const cards = roleChampions.map(({ slug, seo }) => (
      `<a class="card" href="../../champions/${escapeAttr(slug)}/hex-brawl/"><strong>${escapeHtml(seo.name)}</strong><div class="meta">${escapeHtml(seo.keywords[0])}</div></a>`
    )).join("");
    const dir = path.join(rootDir, "guides", role);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), simplePage({
      title: `${roleLabels[role]} Hex Brawl Builds & Best Augments Guide`,
      description: `Find ${roleLabels[role]} Hex Brawl builds, item paths, and best augment guides.`,
      body: `<h1>${roleLabels[role]} Hex Brawl Builds</h1><p>Class page for related ${roleLabels[role].toLowerCase()} champions, focused on Hex Brawl builds, best augments, reroll strategy, and beginner-friendly item paths.</p><div class="grid">${cards}</div>`
    }).replace('href="../index.html"', 'href="../../index.html"'), "utf8");
  }

  await mkdir(path.join(rootDir, "tier-list"), { recursive: true });
  await writeFile(path.join(rootDir, "tier-list", "index.html"), simplePage({
    title: "Hex Brawl Tier List (2026 Meta)",
    description: "Hex Brawl tier list index with links to champion builds and augment recommendations.",
    body: `<h1>Hex Brawl Tier List</h1><p>This tier list entry links into all champion Hex Brawl build pages for the current 2026 meta.</p><div class="grid">${championCards}</div>`
  }), "utf8");

  await mkdir(path.join(rootDir, "meta"), { recursive: true });
  await writeFile(path.join(rootDir, "meta", "index.html"), simplePage({
    title: "Hex Brawl Meta Builds and Augments",
    description: "Current Hex Brawl meta overview with champion builds, item paths, and augment recommendations.",
    body: `<h1>Hex Brawl Meta</h1><p>Current meta index for League of Legends Hex Brawl builds, best augments, and beginner guide pages.</p><div class="grid">${championCards}</div>`
  }), "utf8");
}

async function writeSitemap(champions) {
  const urls = [
    "/",
    "/tier-list/",
    "/meta/",
    ...guidePages,
    ...champions.map(({ slug }) => `/champions/${slug}/hex-brawl/`)
  ];
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.startsWith("/champions/") ? "weekly" : "daily"}</changefreq>
    <priority>${url === "/" ? "1.0" : url.startsWith("/champions/") ? "0.8" : "0.7"}</priority>
  </url>`).join("\n")}
</urlset>
`;
  await writeFile(path.join(rootDir, "sitemap.xml"), xml, "utf8");
  await writeFile(path.join(rootDir, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`, "utf8");
}

const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
const rawEntries = [];
for (const file of files) {
  const slug = path.basename(file, ".json");
  const data = JSON.parse(await readFile(path.join(dataDir, file), "utf8"));
  rawEntries.push({ slug, data });
}

const allSlugs = rawEntries.map((entry) => entry.slug);
const byRole = {};
for (const slug of allSlugs) {
  const role = roleFor(slug);
  byRole[role] ||= [];
  byRole[role].push(slug);
}

const nameLookup = new Map(rawEntries.map(({ slug, data }) => [slug, championSeoName(slug, data)]));
const entries = rawEntries.map(({ slug, data }) => {
  const related = relatedFor(slug, byRole, allSlugs).map((relatedSlug) => ({
    slug: relatedSlug,
    name: nameLookup.get(relatedSlug) || titleCaseSlug(relatedSlug)
  }));
  const seo = seoFor(slug, data, related);
  sanitizeData(data, seo);
  return { slug, data, seo };
});

for (const { slug, data } of entries) {
  const pageDir = path.join(championsDir, slug, "hex-brawl");
  await mkdir(pageDir, { recursive: true });
  await writeFile(path.join(dataDir, `${slug}.json`), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(path.join(pageDir, "index.html"), championPage(slug, data), "utf8");
}

await writeStaticPages(entries);
await writeSitemap(entries);

console.log(`SEO updated for ${entries.length} champion pages.`);
console.log(`Generated ${guidePages.length} guide URLs plus /tier-list/ and /meta/.`);
