import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const aramDir = path.join(rootDir, "aram-mayhem");
const siteUrl = "https://lol-hex-brawl.vercel.app";
const patchVersion = "26.13";
const lastUpdated = "2026-07-07";
const trustNote = "Data is manually curated from public meta sources and gameplay testing. Not affiliated with Riot Games.";
const ddragonFallback = "16.13.1";
const cdragonBase = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";

const roleLabels = {
  mage: "Mage",
  adc: "ADC",
  assassin: "Assassin",
  fighter: "Fighter",
  tank: "Tank",
  support: "Support"
};

const roleSets = {
  mage: new Set([
    "ahri", "anivia", "annie", "aurelion-sol", "aurora", "azir", "brand", "cassiopeia", "diana", "fiddlesticks", "galio", "gragas", "hwei", "karthus", "leblanc", "lillia", "lissandra", "locke", "lux", "malzahar", "morgana", "neeko", "nidalee", "orianna", "qiyana", "rumble", "ryze", "seraphine", "swain", "syndra", "taliyah", "teemo", "twisted-fate", "veigar", "velkoz", "vex", "viktor", "vladimir", "xerath", "ziggs", "zoe", "zyra"
  ]),
  adc: new Set([
    "akshan", "aphelios", "ashe", "caitlyn", "corki", "draven", "ezreal", "graves", "jinx", "kaisa", "kalista", "kindred", "kogmaw", "lucian", "mel", "miss-fortune", "nilah", "quinn", "samira", "senna", "sivir", "smolder", "tristana", "twitch", "varus", "vayne", "xayah", "yunara", "zeri"
  ]),
  assassin: new Set([
    "akali", "ekko", "evelynn", "fizz", "kassadin", "katarina", "kayn", "khazix", "lee-sin", "master-yi", "naafiri", "nocturne", "pantheon", "pyke", "qiyana", "rengar", "shaco", "talon", "viego", "zed"
  ]),
  fighter: new Set([
    "aatrox", "ambessa", "belveth", "briar", "camille", "darius", "fiora", "gangplank", "garen", "gnar", "gwen", "hecarim", "illaoi", "irelia", "jarvan-iv", "jax", "jayce", "kled", "mordekaiser", "nasus", "olaf", "rek-sai", "renekton", "riven", "sett", "shyvana", "trundle", "tryndamere", "udyr", "vi", "volibear", "warwick", "wukong", "xin-zhao", "yasuo", "yone", "yorick", "zaahen"
  ]),
  tank: new Set([
    "alistar", "amumu", "blitzcrank", "braum", "chogath", "dr-mundo", "ksante", "leona", "malphite", "maokai", "nautilus", "nunu", "ornn", "poppy", "rammus", "rell", "sejuani", "shen", "singed", "sion", "skarner", "tahm-kench", "taric", "thresh", "zac"
  ]),
  support: new Set([
    "bard", "ivern", "janna", "karma", "lulu", "milio", "nami", "rakan", "renata-glasc", "sona", "soraka", "yuumi", "zilean"
  ])
};

const counterRoleMap = {
  mage: ["assassin", "fighter", "adc"],
  adc: ["assassin", "mage", "tank"],
  assassin: ["tank", "fighter", "support"],
  fighter: ["adc", "mage", "support"],
  tank: ["adc", "mage", "fighter"],
  support: ["assassin", "fighter", "mage"]
};

const specialNames = {
  aatrox: "Aatrox",
  ahri: "Ahri",
  akali: "Akali",
  akshan: "Akshan",
  alistar: "Alistar",
  ambessa: "Ambessa",
  amumu: "Amumu",
  anivia: "Anivia",
  annie: "Annie",
  aphelios: "Aphelios",
  ashe: "Ashe",
  "aurelion-sol": "Aurelion Sol",
  aurora: "Aurora",
  azir: "Azir",
  bard: "Bard",
  belveth: "Bel'Veth",
  blitzcrank: "Blitzcrank",
  brand: "Brand",
  braum: "Braum",
  briar: "Briar",
  caitlyn: "Caitlyn",
  camille: "Camille",
  cassiopeia: "Cassiopeia",
  chogath: "Cho'Gath",
  corki: "Corki",
  darius: "Darius",
  diana: "Diana",
  "dr-mundo": "Dr. Mundo",
  draven: "Draven",
  ekko: "Ekko",
  elise: "Elise",
  evelynn: "Evelynn",
  ezreal: "Ezreal",
  fiddlesticks: "Fiddlesticks",
  fiora: "Fiora",
  fizz: "Fizz",
  galio: "Galio",
  gangplank: "Gangplank",
  garen: "Garen",
  gnar: "Gnar",
  gragas: "Gragas",
  graves: "Graves",
  gwen: "Gwen",
  hecarim: "Hecarim",
  heimerdinger: "Heimerdinger",
  hwei: "Hwei",
  illaoi: "Illaoi",
  irelia: "Irelia",
  ivern: "Ivern",
  janna: "Janna",
  "jarvan-iv": "Jarvan IV",
  jax: "Jax",
  jayce: "Jayce",
  jhin: "Jhin",
  jinx: "Jinx",
  kaisa: "Kai'Sa",
  kalista: "Kalista",
  karma: "Karma",
  karthus: "Karthus",
  kassadin: "Kassadin",
  katarina: "Katarina",
  kayle: "Kayle",
  kayn: "Kayn",
  kennen: "Kennen",
  khazix: "Kha'Zix",
  kindred: "Kindred",
  kled: "Kled",
  kogmaw: "Kog'Maw",
  ksante: "K'Sante",
  leblanc: "LeBlanc",
  "lee-sin": "Lee Sin",
  leona: "Leona",
  lillia: "Lillia",
  lissandra: "Lissandra",
  locke: "Locke",
  lucian: "Lucian",
  lulu: "Lulu",
  lux: "Lux",
  malphite: "Malphite",
  malzahar: "Malzahar",
  maokai: "Maokai",
  "master-yi": "Master Yi",
  mel: "Mel",
  milio: "Milio",
  "miss-fortune": "Miss Fortune",
  mordekaiser: "Mordekaiser",
  morgana: "Morgana",
  naafiri: "Naafiri",
  nami: "Nami",
  nasus: "Nasus",
  nautilus: "Nautilus",
  neeko: "Neeko",
  nidalee: "Nidalee",
  nilah: "Nilah",
  nocturne: "Nocturne",
  nunu: "Nunu & Willump",
  olaf: "Olaf",
  orianna: "Orianna",
  ornn: "Ornn",
  pantheon: "Pantheon",
  poppy: "Poppy",
  pyke: "Pyke",
  qiyana: "Qiyana",
  quinn: "Quinn",
  rakan: "Rakan",
  rammus: "Rammus",
  "rek-sai": "Rek'Sai",
  rell: "Rell",
  "renata-glasc": "Renata Glasc",
  renekton: "Renekton",
  rengar: "Rengar",
  riven: "Riven",
  rumble: "Rumble",
  ryze: "Ryze",
  samira: "Samira",
  sejuani: "Sejuani",
  senna: "Senna",
  seraphine: "Seraphine",
  sett: "Sett",
  shaco: "Shaco",
  shen: "Shen",
  shyvana: "Shyvana",
  singed: "Singed",
  sion: "Sion",
  sivir: "Sivir",
  skarner: "Skarner",
  smolder: "Smolder",
  sona: "Sona",
  soraka: "Soraka",
  swain: "Swain",
  sylas: "Sylas",
  syndra: "Syndra",
  "tahm-kench": "Tahm Kench",
  taliyah: "Taliyah",
  talon: "Talon",
  taric: "Taric",
  teemo: "Teemo",
  thresh: "Thresh",
  tristana: "Tristana",
  trundle: "Trundle",
  tryndamere: "Tryndamere",
  "twisted-fate": "Twisted Fate",
  twitch: "Twitch",
  udyr: "Udyr",
  urgot: "Urgot",
  varus: "Varus",
  vayne: "Vayne",
  veigar: "Veigar",
  velkoz: "Vel'Koz",
  vex: "Vex",
  vi: "Vi",
  viego: "Viego",
  viktor: "Viktor",
  vladimir: "Vladimir",
  volibear: "Volibear",
  warwick: "Warwick",
  wukong: "Wukong",
  xayah: "Xayah",
  xerath: "Xerath",
  "xin-zhao": "Xin Zhao",
  yasuo: "Yasuo",
  yone: "Yone",
  yorick: "Yorick",
  yunara: "Yunara",
  yuumi: "Yuumi",
  zaahen: "Zaahen",
  zac: "Zac",
  zed: "Zed",
  zeri: "Zeri",
  ziggs: "Ziggs",
  zilean: "Zilean",
  zoe: "Zoe",
  zyra: "Zyra"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function titleCase(slug) {
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function championName(slug, data) {
  return specialNames[slug] || data.champion?.names?.en?.replace(/^the\s+/i, "").split(" ").slice(-2).join(" ") || titleCase(slug);
}

function zhName(data) {
  return data.champion?.names?.zh || "";
}

function championIcon(data) {
  const version = data.gameDataVersion || ddragonFallback;
  const id = data.champion?.id || "Aatrox";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${encodeURIComponent(id)}.png`;
}

function itemIcon(itemId, data) {
  const version = data.gameDataVersion || ddragonFallback;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${encodeURIComponent(itemId)}.png`;
}

function roleFor(slug) {
  for (const [role, set] of Object.entries(roleSets)) {
    if (set.has(slug)) return role;
  }
  return "fighter";
}

function routeName(build, data) {
  const localized = data.localized?.en || {};
  return localized.builds?.[build.key] || build.name || titleCase(build.key || "core build");
}

function routeTag(build, data) {
  const localized = data.localized?.en || {};
  return localized.buildTags?.[build.key] || build.tag || "Core";
}

function routeScore(build, data) {
  const localized = data.localized?.en || {};
  return localized.buildScores?.[build.key] || build.score || "Meta";
}

function augmentName(row, data) {
  const localized = data.localized?.en || {};
  return localized.hexNames?.[row.id] || row.name || row.id;
}

function rolePhrase(roleLabel) {
  return /^[AEIOU]/.test(roleLabel) ? `an ${roleLabel}` : `a ${roleLabel}`;
}

function relatedFor(entry, entries, limit = 5) {
  const role = entry.role;
  return entries
    .filter((candidate) => candidate.slug !== entry.slug && candidate.role === role)
    .slice(0, limit);
}

function countersFor(entry, entries, limit = 6) {
  const roles = counterRoleMap[entry.role] || ["fighter", "mage"];
  const selected = [];
  for (const role of roles) {
    for (const candidate of entries) {
      if (candidate.slug !== entry.slug && candidate.role === role && !selected.includes(candidate)) {
        selected.push(candidate);
        if (selected.length >= limit) return selected;
      }
    }
  }
  return selected;
}

function allKeywords(entry, type) {
  const base = [
    "aram mayhem",
    "aram mayhem tier list",
    "best champions aram mayhem",
    "lol augment guide",
    "league of legends augments"
  ];
  if (type === "build") {
    return [
      `best ${entry.name.toLowerCase()} build aram mayhem`,
      `${entry.name.toLowerCase()} aram mayhem build`,
      `best ${entry.name.toLowerCase()} augments`,
      `${entry.name.toLowerCase()} item build guide`,
      `${entry.name.toLowerCase()} reroll strategy`,
      `${entry.name.toLowerCase()} beginner guide`,
      ...base
    ];
  }
  if (type === "counter") {
    return [
      `how to counter ${entry.name.toLowerCase()} aram mayhem`,
      `best counters ${entry.name.toLowerCase()} aram mayhem`,
      `counter tier list aram mayhem`,
      `${entry.name.toLowerCase()} matchup guide`,
      ...base
    ];
  }
  return [
    `${entry.name.toLowerCase()} aram mayhem guide`,
    `${entry.name.toLowerCase()} beginner guide`,
    `${entry.name.toLowerCase()} item build guide`,
    `${entry.name.toLowerCase()} reroll strategy`,
    ...base
  ];
}

function styleBlock() {
  return `<style>
      :root { color-scheme: dark; --bg:#18130f; --panel:#211812; --card:#30241b; --line:#584532; --text:#f2eadc; --muted:#b59a7b; --accent:#d39a4e; --cyan:#52d6dc; }
      * { box-sizing: border-box; }
      body { margin:0; background:linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.012) 1px, transparent 1px), var(--bg); background-size:34px 34px; color:var(--text); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      a { color:inherit; }
      .shell { width:min(100%, 1080px); margin:0 auto; padding:22px 18px 52px; }
      .top { display:flex; justify-content:space-between; align-items:center; gap:14px; margin-bottom:18px; color:var(--muted); font-size:14px; }
      .top-actions { display:flex; align-items:center; justify-content:flex-end; gap:10px; flex-wrap:wrap; }
      .nav { display:flex; gap:10px; flex-wrap:wrap; }
      .nav a, .chip { border:1px solid var(--line); border-radius:8px; padding:8px 11px; text-decoration:none; background:rgba(48,36,27,.72); }
      .language { min-width:112px; height:36px; border:1px solid var(--line); border-radius:8px; background:#211912; color:var(--text); padding:0 10px; outline:none; }
      .hero { border:1px solid var(--line); border-radius:8px; background:linear-gradient(135deg, rgba(48,36,27,.96), rgba(30,22,16,.94)); padding:26px; display:flex; gap:18px; align-items:center; }
      .hero img { width:88px; height:88px; border-radius:8px; border:1px solid var(--accent); background:#111; object-fit:cover; }
      h1 { margin:0; font-size:clamp(34px, 6vw, 56px); line-height:1.02; letter-spacing:0; }
      h2 { margin:0 0 14px; font-size:26px; line-height:1.2; }
      h3 { margin:0 0 10px; font-size:19px; }
      p { color:var(--muted); line-height:1.7; }
      .eyebrow { color:var(--accent); font-weight:700; font-size:13px; margin-bottom:7px; }
      .trust { margin-top:18px; border:1px solid var(--line); border-radius:8px; background:rgba(33,24,18,.9); padding:14px 16px; display:grid; gap:10px; }
      .trust-row { display:flex; flex-wrap:wrap; gap:8px; }
      .trust-chip { border:1px solid rgba(211,154,78,.5); border-radius:8px; padding:7px 10px; background:rgba(211,154,78,.1); color:#f8e5bf; font-size:13px; font-weight:800; }
      .trust p, .share-copy p { margin:0; }
      .tabs { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin:18px 0; }
      .tabs a { text-align:center; text-decoration:none; border:1px solid var(--line); border-radius:8px; padding:12px; background:#261c15; font-weight:700; }
      .tabs a.active { border-color:var(--accent); color:#fff0d7; }
      .section { margin-top:18px; border:1px solid var(--line); border-radius:8px; background:rgba(33,24,18,.9); padding:18px; }
      .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:12px; }
      .card { border:1px solid rgba(88,69,50,.82); border-radius:8px; background:var(--card); padding:14px; }
      .items, .augments { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      .item, .augment { width:46px; height:46px; border-radius:7px; border:1px solid var(--accent); background:#111; object-fit:cover; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; }
      .augment { width:40px; height:40px; border-color:#4a3a2c; }
      .item img, .augment img { width:100%; height:100%; object-fit:cover; display:block; }
      .table { width:100%; border-collapse:collapse; overflow:hidden; border-radius:8px; }
      .table th, .table td { border-bottom:1px solid var(--line); padding:11px; text-align:left; vertical-align:top; }
      .table th { color:#ffd89e; font-size:13px; }
      .list { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; padding:0; margin:0; list-style:none; }
      .list li { border:1px solid var(--line); border-radius:8px; padding:12px; background:#2a2018; }
      .share-actions { display:flex; flex-wrap:wrap; gap:8px; }
      .copy-button { min-height:34px; border:1px solid rgba(211,154,78,.62); border-radius:8px; background:#352719; color:var(--text); padding:0 11px; cursor:pointer; font-weight:800; }
      .copy-button.copied { border-color:var(--cyan); color:#c9fbff; }
      .share-copy { display:grid; gap:8px; color:var(--muted); line-height:1.65; }
      .share-copy div { border:1px solid rgba(88,69,50,.7); border-radius:8px; background:#261c15; padding:10px; }
      .share-copy strong { color:#f8e5bf; }
      .footer { margin-top:24px; color:#8e7962; font-size:12px; line-height:1.7; }
      @media (max-width: 640px) { .top { align-items:flex-start; flex-direction:column; } .top-actions { justify-content:flex-start; } .hero { align-items:flex-start; padding:18px; } .hero img { width:64px; height:64px; } .tabs { grid-template-columns:1fr; } .shell { padding:14px; } }
    </style>`;
}

function jsonLdScript(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replaceAll("</", "<\\/")}</script>`;
}

function pageShell({ title, description, keywords, canonical, body, jsonLd = [] }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta name="keywords" content="${escapeAttr(keywords.join(", "))}" />
    <link rel="canonical" href="${escapeAttr(canonical)}" />
    ${styleBlock()}
    ${jsonLd.map(jsonLdScript).join("\n    ")}
  </head>
  <body>
    <main class="shell">
      <div class="top">
        <a href="/aram-mayhem/">ARAM Mayhem</a>
        <div class="top-actions">
          <nav class="nav" aria-label="ARAM Mayhem navigation">
            <a href="/aram-mayhem/tier-list/" data-i18n-nav="tier">Tier List</a>
            <a href="/aram-mayhem/meta/" data-i18n-nav="meta">Meta</a>
            <a href="/aram-mayhem/how-to-play/" data-i18n-nav="how">How to Play</a>
            <a href="/" data-i18n-nav="index">Champion Index</a>
          </nav>
          <select id="languageSelect" class="language" aria-label="Language">
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>
      ${body}
      <footer class="footer" data-i18n-footer>Updated for Patch ${patchVersion}. Last updated: ${lastUpdated}. ${trustNote}</footer>
    </main>
    <script>
      const seoLanguageStorageKey = "hexBrawlLanguage";
      const seoSupportedLanguages = ["zh", "en", "ja", "ko", "es"];
      const seoCopy = {
        zh: {
          nav: { tier: "梯度榜", meta: "版本环境", how: "玩法说明", index: "英雄索引" },
          trustPatch: "当前版本：${patchVersion}",
          trustUpdated: "最后更新：${lastUpdated}",
          trustNote: "内容基于公开版本环境、实战体验与资料整理，非 Riot 官方项目。",
          shareTitle: "分享这套出装",
          copyPrefix: "复制",
          copied: "已复制",
          selectText: "请选择文本",
          footer: "当前版本：${patchVersion}。最后更新：${lastUpdated}。内容基于公开版本环境、实战体验与资料整理，非 Riot 官方项目。"
        },
        en: {
          nav: { tier: "Tier List", meta: "Meta", how: "How to Play", index: "Champion Index" },
          trustPatch: "Updated for Patch ${patchVersion}",
          trustUpdated: "Last updated: ${lastUpdated}",
          trustNote: "${trustNote}",
          shareTitle: "Share this build",
          copyPrefix: "Copy",
          copied: "Copied",
          selectText: "Select text",
          footer: "Updated for Patch ${patchVersion}. Last updated: ${lastUpdated}. ${trustNote}"
        },
        ja: {
          nav: { tier: "ティアリスト", meta: "メタ", how: "遊び方", index: "チャンピオン一覧" },
          trustPatch: "Patch ${patchVersion} 対応",
          trustUpdated: "最終更新：${lastUpdated}",
          trustNote: "公開メタ情報とプレイテストをもとに手動整理した非公式ファンプロジェクトです。",
          shareTitle: "このビルドを共有",
          copyPrefix: "コピー",
          copied: "コピー済み",
          selectText: "テキストを選択",
          footer: "Patch ${patchVersion} 対応。最終更新：${lastUpdated}。公開メタ情報とプレイテストをもとに手動整理した非公式ファンプロジェクトです。"
        },
        ko: {
          nav: { tier: "티어 리스트", meta: "메타", how: "플레이 방법", index: "챔피언 목록" },
          trustPatch: "Patch ${patchVersion} 기준",
          trustUpdated: "마지막 업데이트: ${lastUpdated}",
          trustNote: "공개 메타 자료와 플레이 테스트를 바탕으로 수동 정리한 비공식 팬 프로젝트입니다.",
          shareTitle: "이 빌드 공유",
          copyPrefix: "복사",
          copied: "복사됨",
          selectText: "텍스트 선택",
          footer: "Patch ${patchVersion} 기준. 마지막 업데이트: ${lastUpdated}. 공개 메타 자료와 플레이 테스트를 바탕으로 수동 정리한 비공식 팬 프로젝트입니다."
        },
        es: {
          nav: { tier: "Tier List", meta: "Meta", how: "Como jugar", index: "Indice de campeones" },
          trustPatch: "Actualizado para Patch ${patchVersion}",
          trustUpdated: "Ultima actualizacion: ${lastUpdated}",
          trustNote: "Datos curados manualmente a partir de fuentes publicas del meta y pruebas de juego. No afiliado a Riot Games.",
          shareTitle: "Comparte esta build",
          copyPrefix: "Copiar",
          copied: "Copiado",
          selectText: "Selecciona el texto",
          footer: "Actualizado para Patch ${patchVersion}. Ultima actualizacion: ${lastUpdated}. Datos curados manualmente a partir de fuentes publicas del meta y pruebas de juego. No afiliado a Riot Games."
        }
      };
      function seoStoredLanguage() {
        try { return localStorage.getItem(seoLanguageStorageKey); } catch { return null; }
      }
      function seoSaveLanguage(lang) {
        try { localStorage.setItem(seoLanguageStorageKey, lang); } catch {}
      }
      function seoDocumentLang(lang) {
        return lang === "zh" ? "zh-CN" : lang === "ja" ? "ja" : lang === "ko" ? "ko" : lang === "es" ? "es" : "en";
      }
      function seoInitialLanguage() {
        const queryLang = new URLSearchParams(window.location.search).get("lang");
        if (seoSupportedLanguages.includes(queryLang)) return queryLang;
        const stored = seoStoredLanguage();
        return seoSupportedLanguages.includes(stored) ? stored : "en";
      }
      function applySeoLanguage(lang) {
        const copy = seoCopy[lang] || seoCopy.en;
        document.documentElement.lang = seoDocumentLang(lang);
        document.querySelectorAll("[data-i18n-nav]").forEach(function (link) {
          const key = link.getAttribute("data-i18n-nav");
          if (copy.nav[key]) link.textContent = copy.nav[key];
        });
        document.querySelectorAll("[data-i18n-trust-patch]").forEach(function (node) { node.textContent = copy.trustPatch; });
        document.querySelectorAll("[data-i18n-trust-updated]").forEach(function (node) { node.textContent = copy.trustUpdated; });
        document.querySelectorAll("[data-i18n-trust-note]").forEach(function (node) { node.textContent = copy.trustNote; });
        document.querySelectorAll("[data-i18n-share-title]").forEach(function (node) { node.textContent = copy.shareTitle; });
        document.querySelectorAll("[data-copy-share]").forEach(function (button) {
          const label = button.getAttribute("data-copy-label") || "";
          button.textContent = copy.copyPrefix + (label ? " " + label : "");
        });
        document.querySelectorAll("[data-i18n-footer]").forEach(function (node) { node.textContent = copy.footer; });
      }
      const languageSelect = document.getElementById("languageSelect");
      if (languageSelect) {
        const currentLanguage = seoInitialLanguage();
        languageSelect.value = currentLanguage;
        applySeoLanguage(currentLanguage);
        languageSelect.addEventListener("change", function (event) {
          const lang = event.target.value;
          seoSaveLanguage(lang);
          applySeoLanguage(lang);
          const url = new URL(window.location.href);
          url.searchParams.set("lang", lang);
          window.history.replaceState({}, "", url);
        });
      }
      document.addEventListener("click", async function (event) {
        const button = event.target.closest("[data-copy-share]");
        if (!button) return;
        const original = button.textContent;
        const text = button.getAttribute("data-share-text") || "";
        try {
          await navigator.clipboard.writeText(text);
          const copy = seoCopy[languageSelect?.value] || seoCopy.en;
          button.textContent = copy.copied;
          button.classList.add("copied");
          window.setTimeout(function () {
            button.textContent = original;
            button.classList.remove("copied");
          }, 1400);
        } catch {
          const copy = seoCopy[languageSelect?.value] || seoCopy.en;
          button.textContent = copy.selectText;
        }
      });
    </script>
  </body>
</html>
`;
}

function trustPanel() {
  return `<section class="trust" aria-label="Update and data note">
        <div class="trust-row">
          <span class="trust-chip" data-i18n-trust-patch>Updated for Patch ${patchVersion}</span>
          <span class="trust-chip" data-i18n-trust-updated>Last updated: ${lastUpdated}</span>
        </div>
        <p data-i18n-trust-note>${escapeHtml(trustNote)}</p>
      </section>`;
}

function heroBlock(entry, subtitle) {
  return `<section class="hero">
        <img src="${escapeAttr(championIcon(entry.data))}" alt="${escapeAttr(entry.name)} icon" />
        <div>
          <div class="eyebrow">ARAM Mayhem - Patch ${patchVersion}</div>
          <h1>${escapeHtml(subtitle)}</h1>
          <p>${escapeHtml(entry.name)} ARAM Mayhem quick guide for augments, item path, counters, and beginner decisions.</p>
        </div>
      </section>${trustPanel()}`;
}

function shareLines(entry, canonical) {
  const url = canonical || `${siteUrl}/aram-mayhem/${entry.slug}-build/`;
  return [
    ["EN", `${entry.name} ARAM Mayhem quick guide: best augments, item path, and beginner tips. ${url}`],
    ["ZH", `${entry.name} ARAM Mayhem 快速攻略：最佳强化、出装路线和新手提示。${url}`],
    ["JA", `${entry.name} ARAM Mayhem クイックガイド：おすすめオーグメント、アイテムルート、初心者向け tips。${url}`],
    ["KO", `${entry.name} ARAM Mayhem 빠른 가이드: 추천 증강, 아이템 경로, 초보 팁. ${url}`],
    ["ES", `${entry.name} guia rapida de ARAM Mayhem: mejores aumentos, ruta de objetos y consejos para principiantes. ${url}`]
  ];
}

function sharePanel(entry, canonical) {
  const lines = shareLines(entry, canonical);
  return `<section class="section" aria-label="Share this build">
        <div class="section-head">
          <h2 data-i18n-share-title>Share this build</h2>
          <div class="share-actions">${lines.map(([label, text]) => `<button class="copy-button" type="button" data-copy-share data-copy-label="${escapeAttr(label)}" data-share-text="${escapeAttr(text)}">Copy ${label}</button>`).join("")}</div>
        </div>
        <div class="share-copy">${lines.map(([label, text]) => `<div><strong>${label}:</strong> ${escapeHtml(text)}</div>`).join("")}</div>
      </section>`;
}

function tabBlock(entry, active) {
  const tabs = [
    ["build", "Build", `/aram-mayhem/${entry.slug}-build/`],
    ["counter", "Counter", `/aram-mayhem/${entry.slug}-counter/`],
    ["guide", "Guide", `/aram-mayhem/${entry.slug}-guide/`]
  ];
  return `<div class="tabs">${tabs.map(([key, label, href]) => `<a class="${key === active ? "active" : ""}" href="${href}">${label}</a>`).join("")}</div>`;
}

function itemList(items, data) {
  if (!Array.isArray(items) || !items.length) return `<p>No curated item route is available yet.</p>`;
  return `<div class="items">${items.map((item) => `<span class="item"><img src="${escapeAttr(itemIcon(item, data))}" alt="Item ${escapeAttr(item)}" loading="lazy" /></span>`).join("")}</div>`;
}

function buildCards(entry) {
  const builds = Array.isArray(entry.data.builds) ? entry.data.builds : [];
  if (!builds.length) return `<p>No curated build route is available yet.</p>`;
  return `<div class="grid">${builds.map((build) => `<article class="card">
          <h3>${escapeHtml(routeName(build, entry.data))}</h3>
          <p><strong>Route:</strong> ${escapeHtml(routeTag(build, entry.data))} · <strong>Rating:</strong> ${escapeHtml(routeScore(build, entry.data))}</p>
          ${itemList(build.items, entry.data)}
        </article>`).join("")}</div>`;
}

function augmentGroups(entry) {
  const tiers = [
    ["silver", "Silver"],
    ["gold", "Gold"],
    ["prismatic", "Prismatic"]
  ];
  const augmentIcon = (row) => row.icon ? `${cdragonBase}${row.icon}` : "";
  return tiers.map(([key, label]) => {
    const rows = entry.data.hexes?.[key]?.rows || [];
    return `<article class="card">
          <h3>${label} Augments</h3>
          <div class="augments">${rows.slice(0, 8).map((row) => `<span class="chip"><span class="augment">${row.icon ? `<img src="${escapeAttr(augmentIcon(row))}" alt="${escapeAttr(augmentName(row, entry.data))}" loading="lazy" />` : ""}</span> ${escapeHtml(augmentName(row, entry.data))}</span>`).join("")}</div>
        </article>`;
  }).join("");
}

function relatedLinks(entry, entries) {
  const related = relatedFor(entry, entries, 5);
  return `<ul class="list">${related.map((item) => `<li><a href="/aram-mayhem/${escapeAttr(item.slug)}-build/">${escapeHtml(item.name)} ARAM Mayhem build</a></li>`).join("")}
        <li><a href="/aram-mayhem/${escapeAttr(entry.role)}/">${escapeHtml(entry.roleLabel)} ARAM Mayhem category</a></li>
        <li><a href="/aram-mayhem/how-to-play/">ARAM Mayhem beginner guide</a></li>
      </ul>`;
}

function buildPage(entry, entries) {
  const title = `${entry.name} Build Guide - ARAM Mayhem Meta 2026`;
  const description = `Best ${entry.name} build for ARAM Mayhem. Updated patch 2026 meta tier list, runes, items, and counters.`;
  const canonical = `${siteUrl}/aram-mayhem/${entry.slug}-build/`;
  const body = `${heroBlock(entry, `${entry.name} Build Guide - ARAM Mayhem`)}
      ${tabBlock(entry, "build")}
      <section class="section">
        <h2>Best ${escapeHtml(entry.name)} Items</h2>
        <p>Pick better augments in 10 seconds. Item paths come from curated guide data and gameplay testing, then stay grouped for fast in-game lookup.</p>
        ${buildCards(entry)}
      </section>
      <section class="section">
        <h2>Best ${escapeHtml(entry.name)} Augments and Runes</h2>
        <p>Use these tiered augment groups as the reroll reference for ${escapeHtml(entry.name)}. The page also covers best ${escapeHtml(entry.name.toLowerCase())} augments, item build guide, reroll strategy, and beginner guide queries.</p>
        <div class="grid">${augmentGroups(entry)}</div>
      </section>
      <section class="section">
        <h2>Related ARAM Mayhem Pages</h2>
        ${relatedLinks(entry, entries)}
      </section>
      <section class="section">
        <h2>FAQ</h2>
        <h3>What is the best ${escapeHtml(entry.name)} build in ARAM Mayhem?</h3>
        <p>Start with the first curated route above, then adapt defensive or penetration items to the enemy composition.</p>
        <h3>Which augments should ${escapeHtml(entry.name)} reroll for?</h3>
        <p>Prioritize the listed prismatic and gold augments when they match the selected item route.</p>
      </section>
      ${sharePanel(entry, canonical)}`;
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the best ${entry.name} build in ARAM Mayhem?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Use the first curated ${entry.name} route, then adapt defensive or penetration items to the enemy composition.` }
      },
      {
        "@type": "Question",
        "name": `What are the best ${entry.name} augments?`,
        "acceptedAnswer": { "@type": "Answer", "text": "Use the listed silver, gold, and prismatic augment groups as the reroll reference." }
      }
    ]
  };
  return pageShell({ title, description, keywords: allKeywords(entry, "build"), canonical, body, jsonLd: [faq] });
}

function counterPage(entry, entries) {
  const counters = countersFor(entry, entries, 6);
  const title = `How to Counter ${entry.name} in ARAM Mayhem`;
  const description = `Best counters for ${entry.name} in ARAM Mayhem, including matchup pressure, item counter ideas, and win conditions for the 2026 meta.`;
  const canonical = `${siteUrl}/aram-mayhem/${entry.slug}-counter/`;
  const body = `${heroBlock(entry, `How to Counter ${entry.name} in ARAM Mayhem`)}
      ${tabBlock(entry, "counter")}
      <section class="section">
        <h2>Best Counters</h2>
        <p>These are practical matchup-pressure picks generated from champion roles. Use them as a comparison list, then adjust for team composition and player comfort.</p>
        <ul class="list">${counters.map((item) => `<li><a href="/aram-mayhem/${escapeAttr(item.slug)}-build/"><strong>${escapeHtml(item.name)}</strong></a><br><span>${escapeHtml(item.roleLabel)} pressure option against ${escapeHtml(entry.name)}.</span></li>`).join("")}</ul>
      </section>
      <section class="section">
        <h2>Counter Strategy</h2>
        <table class="table">
          <tr><th>Phase</th><th>Plan</th></tr>
          <tr><td>Early fights</td><td>Track ${escapeHtml(entry.name)} engage windows and avoid giving free resets or isolated trades.</td></tr>
          <tr><td>Mid game</td><td>Force fights around cooldown gaps. Buy defensive or anti-burst items when the first route cannot survive all-in pressure.</td></tr>
          <tr><td>Late game</td><td>Protect carries, save crowd control, and punish overextension after ${escapeHtml(entry.name)} spends mobility.</td></tr>
        </table>
      </section>
      <section class="section">
        <h2>Internal Links</h2>
        ${relatedLinks(entry, entries)}
      </section>`;
  return pageShell({ title, description, keywords: allKeywords(entry, "counter"), canonical, body });
}

function guidePage(entry, entries) {
  const title = `${entry.name} ARAM Mayhem Beginner Guide`;
  const description = `${entry.name} beginner guide for ARAM Mayhem with build route notes, reroll strategy, augment priorities, and related meta links.`;
  const canonical = `${siteUrl}/aram-mayhem/${entry.slug}-guide/`;
  const body = `${heroBlock(entry, `${entry.name} ARAM Mayhem Beginner Guide`)}
      ${tabBlock(entry, "guide")}
      <section class="section">
        <h2>How to Play ${escapeHtml(entry.name)}</h2>
        <p>${escapeHtml(entry.name)} is categorized as ${escapeHtml(rolePhrase(entry.roleLabel))} for internal ARAM Mayhem linking. Start from the curated build route, then reroll for augments that reinforce the route's damage, durability, or utility pattern.</p>
      </section>
      <section class="section">
        <h2>Playstyle Tips</h2>
        <ul class="list">
          <li><strong>Reroll strategy:</strong> Keep high-synergy augments from the listed gold and prismatic pools. Avoid off-mode or Arena-only choices.</li>
          <li><strong>Item timing:</strong> Finish the first two core items before over-indexing into situational defenses.</li>
          <li><strong>Teamfights:</strong> Use ARAM terrain and minion waves to create reliable engage or poke windows.</li>
        </ul>
      </section>
      <section class="section">
        <h2>Build Reference</h2>
        ${buildCards(entry)}
      </section>
      <section class="section">
        <h2>More Pages</h2>
        ${relatedLinks(entry, entries)}
      </section>`;
  return pageShell({ title, description, keywords: allKeywords(entry, "guide"), canonical, body });
}

function championCard(entry, suffix = "build") {
  return `<article class="card"><h3><a href="/aram-mayhem/${escapeAttr(entry.slug)}-${suffix}/">${escapeHtml(entry.name)}</a></h3><p>${escapeHtml(entry.roleLabel)} · ${escapeHtml(entry.zh)}</p></article>`;
}

function simplePage({ slug, title, description, keywords, body }) {
  return pageShell({
    title,
    description,
    keywords,
    canonical: `${siteUrl}${slug}`,
    body
  });
}

function tierLabel(role) {
  if (role === "mage" || role === "adc") return "S";
  if (role === "assassin" || role === "fighter") return "A";
  return "B";
}

async function writeFileEnsured(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

async function writeIndexPages(entries) {
  const championCards = entries.map((entry) => championCard(entry)).join("");
  await writeFileEnsured(path.join(aramDir, "index.html"), simplePage({
    slug: "/aram-mayhem/",
    title: "ARAM Mayhem Builds, Tier List, Counters and Guides",
    description: "ARAM Mayhem answer hub with champion builds, counter pages, tier list, patch meta, and beginner-friendly League of Legends augment guides.",
    keywords: ["aram mayhem", "aram mayhem builds", "aram mayhem tier list", "best champions aram mayhem", "lol augment guide"],
    body: `<section class="hero"><div><div class="eyebrow">League of Legends - Patch ${patchVersion}</div><h1>Pick better augments in 10 seconds</h1><p>ARAM Mayhem builds, item paths, counters, and beginner tips for every champion.</p></div></section>
      ${trustPanel()}
      <section class="section"><h2>Champion Build Pages</h2><div class="grid">${championCards}</div></section>`
  }));

  const rows = entries.map((entry) => `<tr><td>${tierLabel(entry.role)} Tier</td><td><a href="/aram-mayhem/${escapeAttr(entry.slug)}-build/">${escapeHtml(entry.name)}</a></td><td>${escapeHtml(entry.roleLabel)}</td><td><a href="/aram-mayhem/${escapeAttr(entry.slug)}-counter/">Counters</a></td></tr>`).join("");
  await writeFileEnsured(path.join(aramDir, "tier-list", "index.html"), simplePage({
    slug: "/aram-mayhem/tier-list/",
    title: "ARAM Mayhem Tier List (2026 Meta)",
    description: "Latest ARAM Mayhem tier list with best champions, role categories, build links, and counter pages for the 2026 meta.",
    keywords: ["aram mayhem tier list", "best champions aram mayhem", "aram mayhem best picks", "aram meta tier list 2026"],
    body: `<section class="hero"><div><div class="eyebrow">ARAM Mayhem - Tier List</div><h1>ARAM Mayhem Tier List (2026 Meta)</h1><p>Quick comparison hub for champion builds, counters, and role categories.</p></div></section>
      ${trustPanel()}
      <section class="section"><h2>Tier List Table</h2><table class="table"><tr><th>Tier</th><th>Champion</th><th>Role</th><th>Counter Page</th></tr>${rows}</table></section>`
  }));

  await writeFileEnsured(path.join(aramDir, "meta", "index.html"), simplePage({
    slug: "/aram-mayhem/meta/",
    title: "ARAM Mayhem Meta July 2026 - Patch 26.13",
    description: "Current ARAM Mayhem meta overview for July 2026 with patch 26.13 champion builds, augment guide links, and tier list navigation.",
    keywords: ["aram mayhem patch 26.13 meta", "aram mayhem meta july 2026", "best items aram mayhem", "best runes aram mayhem"],
    body: `<section class="hero"><div><div class="eyebrow">Patch ${patchVersion}</div><h1>ARAM Mayhem Meta July 2026</h1><p>Use this page as the current meta index for champion builds, counters, and role categories.</p></div></section>
      ${trustPanel()}
      <section class="section"><h2>Meta Champion Links</h2><div class="grid">${championCards}</div></section>`
  }));

  await writeFileEnsured(path.join(aramDir, "how-to-play", "index.html"), simplePage({
    slug: "/aram-mayhem/how-to-play/",
    title: "How to Play ARAM Mayhem - Beginner Guide",
    description: "Learn how to play ARAM Mayhem with beginner tips for rerolls, augments, item builds, teamfights, and champion role selection.",
    keywords: ["how to play aram mayhem", "aram mayhem beginner guide", "what is aram mayhem", "lol augment guide"],
    body: `<section class="hero"><div><div class="eyebrow">Beginner Guide - Patch ${patchVersion}</div><h1>How to Play ARAM Mayhem</h1><p>ARAM Mayhem rewards quick build decisions, augment rerolls, and role-aware teamfight planning.</p></div></section>
      ${trustPanel()}
      <section class="section"><h2>Core Rules</h2><ul class="list"><li>Pick a route before rerolling augments.</li><li>Use role category pages to compare similar champions.</li><li>Adapt defensive items when burst or engage pressure is too high.</li></ul></section>`
  }));

  await writeFileEnsured(path.join(aramDir, "beginners-guide", "index.html"), simplePage({
    slug: "/aram-mayhem/beginners-guide/",
    title: "ARAM Mayhem Beginner Guide - Builds, Augments and Rerolls",
    description: "Beginner-friendly ARAM Mayhem guide explaining builds, augments, reroll strategy, counters, and patch meta navigation.",
    keywords: ["beginner guide aram mayhem", "how to play aram mayhem", "lol augment guide", "aram mayhem builds"],
    body: `<section class="hero"><div><div class="eyebrow">New Player Guide - Patch ${patchVersion}</div><h1>ARAM Mayhem Beginner Guide</h1><p>Start with a champion build page, check counters, then use the tier list and meta pages to compare picks.</p></div></section>
      ${trustPanel()}
      <section class="section"><h2>Recommended Flow</h2><ul class="list"><li>Open a champion build page.</li><li>Compare items and augment tiers.</li><li>Check the counter page for pressure picks.</li></ul></section>`
  }));

  for (const patch of ["26-13", "26-14"]) {
    await writeFileEnsured(path.join(aramDir, "patches", patch, "index.html"), simplePage({
      slug: `/aram-mayhem/patches/${patch}/`,
      title: `ARAM Mayhem Patch ${patch.replace("-", ".")} Meta`,
      description: `ARAM Mayhem patch ${patch.replace("-", ".")} meta page with champion build links, tier list navigation, and update notes.`,
      keywords: [`aram mayhem patch ${patch.replace("-", ".")} meta`, "aram mayhem meta july 2026", "aram mayhem tier list"],
      body: `<section class="hero"><div><div class="eyebrow">Patch ${patch.replace("-", ".")}</div><h1>ARAM Mayhem Patch ${patch.replace("-", ".")} Meta</h1><p>${patch === "26-13" ? "Curated local data is currently aligned to patch 26.13." : "Patch 26.14 tracker page is prepared for future updates."}</p></div></section>
        ${patch === "26-13" ? trustPanel() : ""}
        <section class="section"><h2>Champion Links</h2><div class="grid">${championCards}</div></section>`
    }));
  }

  for (const [role, label] of Object.entries(roleLabels)) {
    const members = entries.filter((entry) => entry.role === role);
    await writeFileEnsured(path.join(aramDir, role, "index.html"), simplePage({
      slug: `/aram-mayhem/${role}/`,
      title: `${label} ARAM Mayhem Builds and Counters`,
      description: `${label} ARAM Mayhem category page with related champion builds, counter pages, item routes, and augment guides.`,
      keywords: [`${label.toLowerCase()} aram mayhem builds`, "aram mayhem builds", "best champions aram mayhem", "lol augment guide"],
      body: `<section class="hero"><div><div class="eyebrow">Category - Patch ${patchVersion}</div><h1>${label} ARAM Mayhem Builds</h1><p>Related ${label.toLowerCase()} champions for fast build and augment comparison.</p></div></section>
        ${trustPanel()}
        <section class="section"><h2>${label} Champions</h2><div class="grid">${members.map((entry) => championCard(entry)).join("")}</div></section>`
    }));
  }
}

async function writeChampionPages(entries) {
  for (const entry of entries) {
    await writeFileEnsured(path.join(aramDir, `${entry.slug}-build`, "index.html"), buildPage(entry, entries));
    await writeFileEnsured(path.join(aramDir, `${entry.slug}-counter`, "index.html"), counterPage(entry, entries));
    await writeFileEnsured(path.join(aramDir, `${entry.slug}-guide`, "index.html"), guidePage(entry, entries));
  }
}

async function writeSitemap(entries) {
  const urls = [
    "/",
    "/aram-mayhem/",
    "/aram-mayhem/tier-list/",
    "/aram-mayhem/meta/",
    "/aram-mayhem/how-to-play/",
    "/aram-mayhem/beginners-guide/",
    "/aram-mayhem/patches/26-13/",
    "/aram-mayhem/patches/26-14/",
    ...Object.keys(roleLabels).map((role) => `/aram-mayhem/${role}/`),
    ...entries.flatMap((entry) => [
      `/aram-mayhem/${entry.slug}-build/`,
      `/aram-mayhem/${entry.slug}-counter/`,
      `/aram-mayhem/${entry.slug}-guide/`
    ])
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <changefreq>${url.includes("-build") || url.includes("-counter") || url.includes("-guide") ? "weekly" : "daily"}</changefreq>
    <priority>${url === "/" || url === "/aram-mayhem/" ? "1.0" : url.includes("tier-list") || url.includes("meta") ? "0.9" : "0.7"}</priority>
  </url>`).join("\n")}
</urlset>
`;
  await writeFile(path.join(rootDir, "sitemap.xml"), xml, "utf8");
  await writeFile(path.join(rootDir, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`, "utf8");
}

async function writeVercelConfig(entries) {
  const redirects = [
    { source: "/tier-list", destination: "/aram-mayhem/tier-list/", permanent: true },
    { source: "/tier-list/", destination: "/aram-mayhem/tier-list/", permanent: true },
    { source: "/meta", destination: "/aram-mayhem/meta/", permanent: true },
    { source: "/meta/", destination: "/aram-mayhem/meta/", permanent: true },
    { source: "/guides", destination: "/aram-mayhem/how-to-play/", permanent: true },
    { source: "/guides/", destination: "/aram-mayhem/how-to-play/", permanent: true }
  ];
  await writeFile(path.join(rootDir, "vercel.json"), `${JSON.stringify({ redirects }, null, 2)}\n`, "utf8");
}

async function main() {
  const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
  const entries = [];
  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const data = JSON.parse(await readFile(path.join(dataDir, file), "utf8"));
    const role = roleFor(slug);
    entries.push({
      slug,
      data,
      name: championName(slug, data),
      zh: zhName(data),
      role,
      roleLabel: roleLabels[role] || titleCase(role)
    });
  }
  await writeIndexPages(entries);
  await writeChampionPages(entries);
  await writeSitemap(entries);
  await writeVercelConfig(entries);
  console.log(`Generated ARAM Mayhem SEO pages for ${entries.length} champions.`);
  console.log(`Sitemap URL count: ${1 + 1 + 1 + 1 + 1 + 1 + 2 + Object.keys(roleLabels).length + entries.length * 3}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
