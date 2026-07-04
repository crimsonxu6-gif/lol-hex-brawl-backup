import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const championsDir = path.join(rootDir, "champions");

const structuredCss = `
      /* structured review display */
      #guides,
      #guideTab,
      #runes,
      #runeTab {
        display: none !important;
      }

      .tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      .hex-row {
        grid-template-columns: 48px 1fr !important;
      }

      .pick {
        display: none !important;
      }

      .hex-icon {
        filter: none !important;
      }
`;

function ensureCss(html) {
  if (html.includes("/* structured review display */")) {
    return html.replace(/\n\s*\/\* structured review display \*\/[\s\S]*?\n\s*<\/style>/, `${structuredCss}    </style>`);
  }
  return html.replace("</style>", `${structuredCss}    </style>`);
}

function patchScript(html) {
  return html
    .replaceAll("elements.guideTab.classList.remove(\"active\");\n          elements.buildTab.classList.add(\"active\");", "elements.buildTab.classList.add(\"active\");")
    .replace(
      `elements.guideTab.textContent = c.guideTab;
        elements.buildTab.textContent = c.buildTab;
        elements.hexTab.textContent = c.hexTab;
        elements.runeTab.textContent = c.runeTab;`,
      `elements.buildTab.textContent = c.buildTab;
        elements.hexTab.textContent = c.hexTab;`
    )
    .replace(
      `elements.runeTitle.textContent = c.runeTitle;
        elements.runeHint.textContent = c.runeHint;
        elements.silverLink.textContent = c.silver;`,
      `elements.silverLink.textContent = c.silver;`
    )
    .replace(
      `renderGuides();
        renderBuilds();
        renderHexes();
        renderRunes();`,
      `renderBuilds();
        renderHexes();`
    )
    .replace(
      `const pick = Number.isFinite(hex.pick) ? hex.pick.toFixed(2) + "%" : "";
                return '<article class="hex-row">' +
                  '<img class="hex-icon" src="' + hexIcon(hex.icon) + '" alt="" loading="lazy" />' +
                  '<div><div class="hex-name">' + escapeHtml(names[hex.id] || hex.id) + '</div></div>' +
                  '<div class="pick">' + pick + '<small>' + escapeHtml(c.pickRate) + '</small></div>' +
                  "</article>";`,
      `return '<article class="hex-row">' +
                  '<img class="hex-icon" src="' + hexIcon(hex.icon) + '" alt="" loading="lazy" />' +
                  '<div><div class="hex-name">' + escapeHtml(names[hex.id] || hex.id) + '</div></div>' +
                  "</article>";`
    );
}

const entries = await readdir(championsDir, { withFileTypes: true });
let count = 0;
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const pagePath = path.join(championsDir, entry.name, "hex-brawl", "index.html");
  let html;
  try {
    html = await readFile(pagePath, "utf8");
  } catch {
    continue;
  }
  html = patchScript(ensureCss(html));
  await writeFile(pagePath, html, "utf8");
  count += 1;
}

console.log(`Updated ${count} detail pages.`);
