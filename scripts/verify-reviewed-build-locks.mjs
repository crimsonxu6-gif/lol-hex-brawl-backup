import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data", "hex-brawl", "champions");
const lockPath = path.join(rootDir, "data", "hex-brawl", "reviewed-build-locks.json");

function buildHash(builds) {
  return createHash("sha256")
    .update(JSON.stringify(builds))
    .digest("hex")
    .slice(0, 16);
}

const lock = JSON.parse(await readFile(lockPath, "utf8"));
const changed = [];
for (const slug of lock.lockedSlugs || []) {
  const data = JSON.parse(await readFile(path.join(dataDir, `${slug}.json`), "utf8"));
  const current = (data.builds || []).map((build) => ({
    key: build.key,
    items: build.items || []
  }));
  const currentHash = buildHash(current);
  const expectedHash = lock.builds?.[slug]?.hash;
  if (currentHash !== expectedHash) {
    changed.push({
      slug,
      expected: lock.builds?.[slug]?.builds || [],
      current
    });
  }
}

if (changed.length) {
  console.error(`Reviewed build lock mismatch: ${changed.length} champion(s).`);
  for (const item of changed) {
    console.error(`${item.slug}`);
    console.error(`  expected ${JSON.stringify(item.expected)}`);
    console.error(`  current  ${JSON.stringify(item.current)}`);
  }
  process.exit(1);
}

console.log(`Reviewed build locks verified: ${(lock.lockedSlugs || []).length} champions.`);
