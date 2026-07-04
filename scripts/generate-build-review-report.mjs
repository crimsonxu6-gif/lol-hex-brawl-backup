import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(rootDir, "captures", "build-review-report");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const guideDir = path.join(rootDir, "assets", "guides", "hex-brawl", "16.13");
const itemIconDir = path.join(rootDir, ".cache", "ddragon-16.13.1-items");
const itemData = JSON.parse(await readFile(path.join(itemIconDir, "item-zh_CN.json"), "utf8")).data;
const reviewedLockPath = path.join(rootDir, "data", "hex-brawl", "reviewed-build-locks.json");
const excludedGuideFiles = new Set(["aphelios-ad.jpg", "shyvana-ad.jpg"]);

const reviewBatchSlugs = [
  "vladimir",
  "karthus",
  "maokai",
  "nidalee",
  "swain",
  "soraka",
  "teemo",
  "twitch",
  "xayah",
  "locke",
  "yunara"
];

const reviewBatchSet = new Set(reviewBatchSlugs);
const reviewOrder = new Map(reviewBatchSlugs.map((slug, index) => [slug, index]));

const championZh = {
  akshan: "阿克尚",
  alistar: "阿利斯塔",
  ambessa: "安蓓萨",
  amumu: "阿木木",
  aphelios: "厄斐琉斯",
  aurora: "阿萝拉",
  azir: "阿兹尔",
  blitzcrank: "布里茨",
  briar: "贝蕾亚",
  caitlyn: "凯特琳",
  chogath: "科加斯",
  corki: "库奇",
  draven: "德莱文",
  ekko: "艾克",
  elise: "伊莉丝",
  fiddlesticks: "费德提克",
  fiora: "菲奥娜",
  fizz: "菲兹",
  galio: "加里奥",
  gangplank: "普朗克",
  gnar: "纳尔",
  gragas: "古拉加斯",
  gwen: "格温",
  hecarim: "赫卡里姆",
  heimerdinger: "黑默丁格",
  hwei: "彗",
  illaoi: "俄洛伊",
  janna: "迦娜",
  "jarvan-iv": "嘉文四世",
  jax: "贾克斯",
  jayce: "杰斯",
  jhin: "烬",
  karma: "卡尔玛",
  kassadin: "卡萨丁",
  kindred: "千珏",
  kled: "克烈",
  kogmaw: "克格莫",
  ksante: "奎桑提",
  leona: "蕾欧娜",
  malphite: "墨菲特",
  malzahar: "玛尔扎哈",
  mel: "梅尔",
  milio: "米利欧",
  nami: "娜美",
  nasus: "内瑟斯",
  nautilus: "诺提勒斯",
  orianna: "奥莉安娜",
  poppy: "波比",
  pyke: "派克",
  rakan: "洛",
  rammus: "拉莫斯",
  rell: "芮尔",
  "renata-glasc": "烈娜塔",
  riven: "锐雯",
  rumble: "兰博",
  ryze: "瑞兹",
  sejuani: "瑟庄妮",
  senna: "赛娜",
  shaco: "萨科",
  shen: "慎",
  shyvana: "希瓦娜",
  singed: "辛吉德",
  sivir: "希维尔",
  skarner: "斯卡纳",
  smolder: "斯莫德",
  sona: "娑娜",
  sylas: "塞拉斯",
  syndra: "辛德拉",
  "tahm-kench": "塔姆",
  thresh: "锤石",
  tristana: "崔丝塔娜",
  tryndamere: "泰达米尔",
  "twisted-fate": "崔斯特",
  udyr: "乌迪尔",
  varus: "韦鲁斯",
  velkoz: "维克兹",
  vex: "薇古丝",
  viego: "佛耶戈",
  viktor: "维克托",
  volibear: "沃利贝尔",
  wukong: "孙悟空",
  xerath: "泽拉斯",
  "xin-zhao": "赵信",
  yuumi: "悠米",
  zaahen: "亚恒",
  ziggs: "吉格斯",
  zilean: "基兰",
  zyra: "婕拉",
  vladimir: "弗拉基米尔",
  karthus: "卡尔萨斯",
  maokai: "茂凯",
  nidalee: "奈德丽",
  swain: "斯维因",
  soraka: "索拉卡",
  teemo: "提莫",
  twitch: "图奇",
  xayah: "霞",
  locke: "洛克",
  yunara: "芸阿娜"
};

const routeLabels = {
  standard: "常规出装",
  tank: "肉装",
  ap: "AP 出装",
  "ap-2": "AP 出装 2",
  "ap-tank": "AP/肉装",
  bruiser: "战士出装",
  crit: "暴击出装",
  "draw-sword": "亮剑出装",
  lethality: "穿甲出装",
  onhit: "特效出装",
  support: "辅助出装",
  healing: "治疗出装",
  ad: "AD 出装",
  "double-tear": "双女神泪出装",
  "death-ring": "死亡之环出装",
  wildarrows: "荒野剑出装",
  kraken: "海妖出装"
};

const typeLabels = {
  tank: "肉装",
  ap: "AP",
  bruiser: "战士",
  crit: "暴击",
  "draw-sword": "亮剑",
  lethality: "穿甲",
  onhit: "特效",
  support: "辅助",
  ad: "AD",
  "death-ring": "死亡之环",
  wildarrows: "荒野剑",
  kraken: "海妖"
};

let reviewedLocks = { lockedSlugs: [] };
try {
  reviewedLocks = JSON.parse(await readFile(reviewedLockPath, "utf8"));
} catch {
  reviewedLocks = { lockedSlugs: [] };
}
const lockedSlugs = new Set(reviewedLocks.lockedSlugs || []);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function relFromReport(...parts) {
  return path.relative(reportDir, path.join(rootDir, ...parts)).replaceAll(path.sep, "/");
}

function itemIconSrc(id) {
  return relFromReport(".cache", "ddragon-16.13.1-items", `${id}.png`);
}

function guideSrc(file) {
  return relFromReport("assets", "guides", "hex-brawl", "16.13", file);
}

function detailHref(slug) {
  return relFromReport("champions", slug, "hex-brawl", "index.html");
}

function fallbackRouteLabel(key) {
  if (!key) return "出装";
  return String(key)
    .split("-")
    .map((part) => routeLabels[part] || typeLabels[part] || part.toUpperCase())
    .join(" / ");
}

function routeLabel(build) {
  return routeLabels[build.key] || routeLabels[build.type] || fallbackRouteLabel(build.key || build.type);
}

function itemHtml(id, index) {
  const item = itemData[id];
  const name = item?.name || "未找到物品";
  const missing = item ? "" : " missing";
  return `<div class="item${missing}">
    <span class="slot">${index + 1}</span>
    <img src="${itemIconSrc(id)}" alt="" loading="lazy" />
    <div class="item-text">
      <strong>${escapeHtml(name)}</strong>
      <span>ID ${escapeHtml(id)}</span>
    </div>
  </div>`;
}

function buildRouteHtml(build) {
  const items = Array.isArray(build.items) ? build.items : [];
  return `<section class="route">
    <div class="route-head">
      <h3>${escapeHtml(routeLabel(build))}</h3>
      <span>${escapeHtml(typeLabels[build.type] || typeLabels[build.key] || build.type || build.key || "")}</span>
    </div>
    <div class="items">${items.length ? items.map(itemHtml).join("") : '<p class="empty">当前没有录入装备</p>'}</div>
  </section>`;
}

function routeMatchesBuild(route, build) {
  const routeText = route.toLowerCase();
  const haystack = [build.key, build.type].filter(Boolean).map((value) => String(value).toLowerCase());
  if (haystack.includes(routeText)) return true;
  return haystack.some((value) => routeText.includes(value) || value.includes(routeText));
}

function relatedBuilds(route, data) {
  const builds = data?.builds || [];
  if (builds.length <= 1) return builds;
  const exact = builds.filter((build) => routeMatchesBuild(route, build));
  if (exact.length) return exact;
  if (route === "alt") return builds.slice(1);
  return builds;
}

async function guideMappingsFromAssets() {
  const entries = [];
  const sortedSlugs = [...reviewBatchSet].sort((a, b) => b.length - a.length);
  const files = await readdir(guideDir);
  for (const file of files.filter((name) => /\.(?:jpg|jpeg|png|webp)$/i.test(name)).sort()) {
    if (excludedGuideFiles.has(file.toLowerCase())) continue;
    const base = file.replace(/\.[^.]+$/, "").toLowerCase();
    const slug = sortedSlugs.find((candidate) => base === candidate || base.startsWith(`${candidate}-`));
    if (!slug || !reviewBatchSet.has(slug)) continue;
    const route = base === slug ? "standard" : base.slice(slug.length + 1);
    entries.push({ file, slug, route });
  }
  entries.sort((a, b) => (reviewOrder.get(a.slug) ?? 9999) - (reviewOrder.get(b.slug) ?? 9999) || a.route.localeCompare(b.route));
  return entries;
}

function cardHtml(entry, data) {
  const nameZh = championZh[entry.slug] || data?.champion?.id || entry.slug;
  const nameEn = data?.champion?.id || entry.slug;
  const builds = relatedBuilds(entry.route, data);
  const status = lockedSlugs.has(entry.slug) ? "已锁定" : "未锁定";
  const statusClass = lockedSlugs.has(entry.slug) ? " locked" : "";
  const searchable = [
    entry.slug,
    entry.route,
    nameZh,
    nameEn,
    status,
    ...(builds || []).flatMap((build) => (build.items || []).map((id) => itemData[id]?.name || id))
  ].join(" ");
  return `<article class="card" data-search="${escapeHtml(searchable.toLowerCase())}" data-status="${escapeHtml(status)}">
    <header class="card-head">
      <div>
        <h2>${escapeHtml(nameZh)}</h2>
        <p>${escapeHtml(entry.slug)} / ${escapeHtml(routeLabels[entry.route] || fallbackRouteLabel(entry.route))} / ${escapeHtml(entry.file)}</p>
      </div>
      <div class="actions">
        <span class="badge${statusClass}">${escapeHtml(status)}</span>
        <a href="${detailHref(entry.slug)}" target="_blank">详情页</a>
      </div>
    </header>
    <div class="compare">
      <div class="guide">
        <div class="panel-title">一图流装备区</div>
        <a href="${guideSrc(entry.file)}" target="_blank">
          <img src="${guideSrc(entry.file)}" alt="" loading="lazy" />
        </a>
      </div>
      <div class="current">
        <div class="panel-title">当前网页录入</div>
        ${builds.length ? builds.map((build) => buildRouteHtml(build)).join("") : '<p class="empty">没有匹配到当前路线装备</p>'}
      </div>
    </div>
  </article>`;
}

const dataBySlug = new Map();
for (const slug of reviewBatchSlugs) {
  try {
    const data = JSON.parse(await readFile(path.join(dataDir, `${slug}.json`), "utf8"));
    dataBySlug.set(slug, data);
  } catch {
    dataBySlug.set(slug, null);
  }
}

const entries = await guideMappingsFromAssets();
const cards = entries.map((entry) => cardHtml(entry, dataBySlug.get(entry.slug))).join("\n");
const lockedCount = entries.filter((entry) => lockedSlugs.has(entry.slug)).length;
const missingGuideSlugs = reviewBatchSlugs.filter((slug) => !entries.some((entry) => entry.slug === slug));

await mkdir(reportDir, { recursive: true });
await writeFile(path.join(reportDir, "index.html"), `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>海克斯大乱斗装备审核</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #18130f;
        --panel: #221a14;
        --card: #2c2119;
        --line: #5b4938;
        --text: #f0e6d8;
        --muted: #a99681;
        --accent: #d5a257;
        --ok: #7fcf9f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255,255,255,.012) 1px, transparent 1px),
          var(--bg);
        background-size: 34px 34px, 34px 34px, auto;
        color: var(--text);
        font-family: Inter, "Noto Sans SC", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main { width: min(100%, 1320px); margin: 0 auto; padding: 22px; }
      .top { position: sticky; top: 0; z-index: 5; padding: 14px 0 16px; background: linear-gradient(180deg, #18130f 84%, rgba(24,19,15,0)); }
      h1 { margin: 0 0 8px; font-size: 30px; line-height: 1.15; }
      .note { margin: 0; color: var(--muted); line-height: 1.55; }
      .tools { display: grid; grid-template-columns: minmax(220px, 1fr) auto auto; gap: 10px; margin-top: 14px; align-items: center; }
      input, select {
        height: 40px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: #211912;
        color: var(--text);
        padding: 0 12px;
        outline: none;
      }
      .count { color: var(--muted); font-size: 13px; white-space: nowrap; }
      .missing-list { margin-top: 10px; color: #d5b17c; font-size: 13px; }
      .card {
        margin: 14px 0;
        border: 1px solid rgba(91,73,56,.7);
        border-radius: 8px;
        background: rgba(34, 26, 20, .94);
        overflow: hidden;
      }
      .card[hidden] { display: none; }
      .card-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(91,73,56,.55);
      }
      h2 { margin: 0; font-size: 20px; }
      .card-head p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
      .actions { display: flex; align-items: center; gap: 10px; }
      .badge {
        display: inline-flex;
        align-items: center;
        height: 28px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--muted);
        font-size: 13px;
        white-space: nowrap;
      }
      .badge.locked { border-color: rgba(127,207,159,.5); color: var(--ok); }
      a { color: #f2c27a; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .compare { display: grid; grid-template-columns: minmax(420px, 1.12fr) minmax(420px, .88fr); gap: 14px; padding: 14px; }
      .panel-title { margin: 0 0 8px; color: var(--accent); font-weight: 800; }
      .guide img {
        display: block;
        width: 100%;
        aspect-ratio: 2.45 / 1;
        object-fit: cover;
        object-position: 4% 22%;
        border: 1px solid rgba(197,150,92,.42);
        border-radius: 6px;
        background: #0f0c09;
      }
      .route {
        border: 1px solid rgba(91,73,56,.58);
        border-radius: 7px;
        padding: 10px;
        background: #2b2119;
      }
      .route + .route { margin-top: 10px; }
      .route-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .route h3 { margin: 0; font-size: 17px; }
      .route-head span { color: var(--muted); font-size: 12px; text-transform: uppercase; }
      .items { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .item {
        position: relative;
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr);
        gap: 9px;
        align-items: center;
        min-height: 62px;
        padding: 7px;
        border: 1px solid rgba(91,73,56,.58);
        border-radius: 7px;
        background: #211912;
      }
      .slot {
        position: absolute;
        left: 4px;
        top: 4px;
        display: grid;
        place-items: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(0,0,0,.7);
        color: #f8d18a;
        font-size: 11px;
        font-weight: 800;
      }
      .item img {
        width: 52px;
        height: 52px;
        border-radius: 6px;
        background: #090807;
      }
      .item strong { display: block; font-size: 14px; line-height: 1.25; overflow-wrap: anywhere; }
      .item span:last-child { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; }
      .missing { outline: 1px solid #b85b5b; }
      .empty { margin: 8px 0; color: var(--muted); }
      @media (max-width: 940px) {
        main { padding: 14px; }
        .tools { grid-template-columns: 1fr; }
        .card-head, .actions { align-items: flex-start; }
        .card-head { flex-direction: column; }
        .compare { grid-template-columns: 1fr; }
        .items { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="top">
        <h1>海克斯大乱斗装备审核</h1>
        <p class="note">当前只保留本轮未完成英雄。左侧是一图流装备区域，右侧是当前网页录入。已完成的旧英雄不再出现在这里。</p>
        <div class="tools">
          <input id="search" type="search" placeholder="搜索英雄、路线、装备名或 ID" />
          <select id="status">
            <option value="">全部状态</option>
            <option value="已锁定">只看已锁定</option>
            <option value="未锁定">只看未锁定</option>
          </select>
          <div class="count"><span id="visibleCount">${entries.length}</span> / ${entries.length} 张一图流，已锁定 ${lockedCount}</div>
        </div>
        ${missingGuideSlugs.length ? `<div class="missing-list">名单中未找到一图流图片：${missingGuideSlugs.map((slug) => escapeHtml(championZh[slug] || slug)).join("、")}</div>` : ""}
      </div>
      ${cards}
    </main>
    <script>
      const search = document.getElementById("search");
      const status = document.getElementById("status");
      const cards = [...document.querySelectorAll(".card")];
      const visibleCount = document.getElementById("visibleCount");
      function applyFilters() {
        const q = search.value.trim().toLowerCase();
        const s = status.value;
        let count = 0;
        for (const card of cards) {
          const textMatch = !q || card.dataset.search.includes(q);
          const statusMatch = !s || card.dataset.status === s;
          const show = textMatch && statusMatch;
          card.hidden = !show;
          if (show) count += 1;
        }
        visibleCount.textContent = count;
      }
      search.addEventListener("input", applyFilters);
      status.addEventListener("change", applyFilters);
    </script>
  </body>
</html>
`, "utf8");

console.log(JSON.stringify({
  report: path.join(reportDir, "index.html"),
  entries: entries.length,
  locked: lockedCount,
  missingGuideSlugs
}, null, 2));
