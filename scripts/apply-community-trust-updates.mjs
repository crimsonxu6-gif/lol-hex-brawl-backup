import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const championsDir = path.join(rootDir, "champions");
const siteUrl = "https://lol-hex-brawl.vercel.app";
const patchVersion = "26.13";
const lastUpdated = "2026-07-07";
const trustNote = "Data is manually curated from public meta sources and gameplay testing. Not affiliated with Riot Games.";
const trustNoteZh = "内容基于公开版本环境、实战体验与资料整理，非 Riot 官方项目。";

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

function publicName(slug, data) {
  return data.seo?.name || data.champion?.names?.en?.replace(/^the\s+/i, "").split(" ").slice(-2).join(" ") || titleCaseSlug(slug);
}

function updateText(value) {
  if (typeof value !== "string") return value;
  return value
    .replaceAll("Patch 16.13", `Patch ${patchVersion}`)
    .replaceAll("Patch 16.12", `Patch ${patchVersion}`)
    .replaceAll("Hex Brawl", "ARAM Mayhem")
    .replaceAll("hex brawl", "aram mayhem");
}

function updateData(slug, data) {
  const name = publicName(slug, data);
  data.patch = patchVersion;
  data.updatedAt = lastUpdated;
  data.sourceNote = trustNote;
  data.sourceNoteLocalized = {
    zh: `当前版本：${patchVersion}。最后更新：${lastUpdated}。${trustNoteZh}`,
    en: `Updated for Patch ${patchVersion}. Last updated: ${lastUpdated}. ${trustNote}`,
    ja: `Patch ${patchVersion} 対応。最終更新：${lastUpdated}。公開メタ情報とプレイテストをもとに手動整理した非公式ファンプロジェクトです。`,
    ko: `Patch ${patchVersion} 기준. 마지막 업데이트: ${lastUpdated}. 공개 메타 자료와 플레이 테스트를 바탕으로 수동 정리한 비공식 팬 프로젝트입니다.`,
    es: `Actualizado para Patch ${patchVersion}. Ultima actualizacion: ${lastUpdated}. Datos curados manualmente a partir de fuentes publicas del meta y pruebas de juego. No afiliado a Riot Games.`
  };

  for (const loc of Object.values(data.localized || {})) {
    if (!loc || typeof loc !== "object") continue;
    for (const key of ["eyebrow", "meta", "buildHint", "hexHint", "guideHint"]) {
      loc[key] = updateText(loc[key]);
    }
  }

  data.seo ||= {};
  data.seo.name = data.seo.name || name;
  data.seo.title = updateText(data.seo.title || `${name} ARAM Mayhem Build & Best Augments Guide (2026 Meta)`);
  data.seo.description = updateText(data.seo.description || `Find the best ARAM Mayhem augments and builds for ${name} in the current meta.`);
  data.seo.keywords = Array.from(new Set([
    ...(Array.isArray(data.seo.keywords) ? data.seo.keywords.map(updateText) : []),
    `${name.toLowerCase()} aram mayhem build`,
    `best ${name.toLowerCase()} augments`,
    "aram mayhem",
    "lol augment guide"
  ]));
}

const trustCss = `
      /* community trust updates */
      .trust-panel { margin-top: 16px; border: 1px solid var(--line-soft); border-radius: 8px; background: rgba(34,26,20,.82); padding: 14px 16px; }
      .trust-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
      .trust-chip { border: 1px solid rgba(197,150,92,.55); border-radius: 8px; padding: 6px 9px; background: rgba(197,150,92,.12); color: var(--accent-2); font-size: 12px; font-weight: 800; }
      .trust-note { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
      .share-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .copy-button { min-height: 34px; border: 1px solid rgba(197,150,92,.62); border-radius: 8px; background: rgba(45,35,26,.9); color: var(--text); padding: 0 11px; cursor: pointer; font-weight: 800; }
      .copy-button.copied { border-color: #52d6dc; color: #c9fbff; }
      .share-copy { display: grid; gap: 8px; color: var(--muted); line-height: 1.65; }
      .share-copy div { border: 1px solid var(--line-soft); border-radius: 8px; background: var(--panel-2); padding: 10px; }
      .share-copy strong { color: var(--accent-2); }
      /* end community trust updates */
`;

function ensureCss(html) {
  const cleaned = html.replace(/\n\s*\/\* community trust updates \*\/[\s\S]*?\/\* end community trust updates \*\/\r?\n/, "\n");
  return cleaned.replace("      .footer {", `${trustCss}      .footer {`);
}

function trustSection() {
  return `<section class="trust-panel" aria-label="Update and data note">
        <div class="trust-row">
          <span class="trust-chip">Updated for Patch ${patchVersion}</span>
          <span class="trust-chip">Last updated: ${lastUpdated}</span>
        </div>
        <p class="trust-note">${escapeHtml(trustNote)} ${escapeHtml(trustNoteZh)}</p>
      </section>`;
}

function shareLines(name, url) {
  return [
    ["EN", `${name} ARAM Mayhem quick guide: best augments, item path, and beginner tips. ${url}`],
    ["ZH", `${name} ARAM Mayhem 快速攻略：最佳强化、出装路线和新手提示。${url}`],
    ["JA", `${name} ARAM Mayhem クイックガイド：おすすめオーグメント、アイテムルート、初心者向け tips。${url}`],
    ["KO", `${name} ARAM Mayhem 빠른 가이드: 추천 증강, 아이템 경로, 초보 팁. ${url}`],
    ["ES", `${name} guia rapida de ARAM Mayhem: mejores aumentos, ruta de objetos y consejos para principiantes. ${url}`]
  ];
}

function shareSection(slug, data) {
  const name = publicName(slug, data);
  const url = `${siteUrl}/champions/${slug}/hex-brawl/`;
  const lines = shareLines(name, url);
  return `<section class="section" aria-label="Share this build">
        <div class="section-head">
          <h2>Share this build</h2>
          <div class="share-actions">${lines.map(([label, text]) => `<button class="copy-button" type="button" data-copy-share data-share-text="${escapeAttr(text)}">Copy ${label}</button>`).join("")}</div>
        </div>
        <div class="share-copy">${lines.map(([label, text]) => `<div><strong>${label}:</strong> ${escapeHtml(text)}</div>`).join("")}</div>
      </section>`;
}

const copyScript = `
      document.addEventListener("click", async function (event) {
        const button = event.target.closest("[data-copy-share]");
        if (!button) return;
        const original = button.textContent;
        const text = button.getAttribute("data-share-text") || "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          button.classList.add("copied");
          window.setTimeout(function () {
            button.textContent = original;
            button.classList.remove("copied");
          }, 1400);
        } catch {
          button.textContent = "Select text";
        }
      });
`;

function updateHtml(slug, data, html) {
  let next = updateText(html);
  next = ensureCss(next);
  next = next.replace(/\n\s*<section class="trust-panel" aria-label="Update and data note">[\s\S]*?<\/section>\r?\n/g, "\n");
  next = next.replace(/\n\s*<section class="section" aria-label="Share this build">[\s\S]*?<\/section>\r?\n/g, "\n");
  next = next.replace(/(<\/section>\r?\n\r?\n\s*<nav class="tabs")/, `</section>\n\n      ${trustSection()}\n\n      <nav class="tabs"`);
  next = next.replace(/(\r?\n\s*<footer id="footerText")/, `\n\n      ${shareSection(slug, data)}$1`);
  if (!next.includes("[data-copy-share]") || !next.includes("navigator.clipboard.writeText")) {
    next = next.replace("      loadChampionData();", `${copyScript}\n      loadChampionData();`);
  } else if (!next.includes("navigator.clipboard.writeText")) {
    next = next.replace("      loadChampionData();", `${copyScript}\n      loadChampionData();`);
  }
  return next;
}

const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
let dataCount = 0;
let pageCount = 0;

for (const file of files) {
  const slug = path.basename(file, ".json");
  const dataPath = path.join(dataDir, file);
  const data = JSON.parse(await readFile(dataPath, "utf8"));
  updateData(slug, data);
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  dataCount += 1;

  const pagePath = path.join(championsDir, slug, "hex-brawl", "index.html");
  let html;
  try {
    html = await readFile(pagePath, "utf8");
  } catch {
    continue;
  }
  await writeFile(pagePath, updateHtml(slug, data, html), "utf8");
  pageCount += 1;
}

console.log(`Updated trust/share metadata for ${dataCount} data files and ${pageCount} champion detail pages.`);
