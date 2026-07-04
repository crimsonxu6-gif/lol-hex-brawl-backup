import { loadConfig, tapVisibleText } from "./adb.mjs";

const config = await loadConfig();
const text = process.argv.slice(2).join(" ");

if (!text) {
  console.error("Usage: node scripts/mobile/tap-text.mjs <visible-text>");
  process.exit(1);
}

const bounds = await tapVisibleText(config, text, { xmlPath: "captures/debug/tap-text-window.xml" });

if (!bounds) {
  console.error(`Text not found: ${text}`);
  process.exit(2);
}

console.log(`Tapped "${text}" at ${bounds.center.join(",")}`);
