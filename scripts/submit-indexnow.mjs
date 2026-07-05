import fs from "node:fs/promises";

const host = "lol-hex-brawl.vercel.app";
const siteUrl = `https://${host}`;
const key = "c19f6cfb5cdd176ff02d254e4bd1dc60";
const keyLocation = `${siteUrl}/${key}.txt`;
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";

const sitemap = await fs.readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (!urlList.length) {
  throw new Error("No URLs found in sitemap.xml");
}

const payload = {
  host,
  key,
  keyLocation,
  urlList,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

const body = await response.text();

console.log(`Submitted ${urlList.length} URLs to ${endpoint}`);
console.log(`Status: ${response.status} ${response.statusText}`);
if (body.trim()) console.log(body);

if (!response.ok && response.status !== 202) {
  process.exitCode = 1;
}
