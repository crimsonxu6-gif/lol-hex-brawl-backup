import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const lockPath = path.join(rootDir, "data", "hex-brawl", "reviewed-build-locks.json");

const lockedSlugs = [
  "brand",
  "yasuo",
  "sett",
  "yone",
  "garen",
  "jinx",
  "ashe",
  "kaisa",
  "vayne",
  "zed",
  "katarina",
  "master-yi",
  "lee-sin",
  "lux",
  "ahri",
  "ezreal",
  "samira",
  "darius",
  "mordekaiser",
  "veigar",
  "kayle"
];

function buildHash(builds) {
  return createHash("sha256")
    .update(JSON.stringify(builds))
    .digest("hex")
    .slice(0, 16);
}

const builds = {};
for (const slug of lockedSlugs) {
  const data = JSON.parse(await readFile(path.join(dataDir, `${slug}.json`), "utf8"));
  builds[slug] = {
    championId: data.champion?.id || slug,
    labels: data.localized?.zh?.builds || {},
    builds: (data.builds || []).map((build) => ({
      key: build.key,
      items: build.items || []
    }))
  };
  builds[slug].hash = buildHash(builds[slug].builds);
}

await writeFile(lockPath, `${JSON.stringify({
  schemaVersion: 1,
  updatedAt: "2026-07-01",
  purpose: "Reviewed build baselines. Batch import scripts must skip these champions unless explicitly forced.",
  lockedSlugs,
  builds
}, null, 2)}\n`, "utf8");

console.log(`Locked reviewed builds for ${lockedSlugs.length} champions at ${lockPath}`);
