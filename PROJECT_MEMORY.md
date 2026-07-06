# LOL Hex Brawl Project Memory

## 2026-07-06 SEO Direction Override

The public SEO direction is now ARAM Mayhem, not Hex Brawl.

Use these rules for all new public SEO work:

- Main keyword: `ARAM Mayhem`.
- Primary public hub: `https://lol-hex-brawl.vercel.app/aram-mayhem/`.
- Champion build URLs: `/aram-mayhem/{champion}-build/`.
- Champion counter URLs: `/aram-mayhem/{champion}-counter/`.
- Champion guide URLs: `/aram-mayhem/{champion}-guide/`.
- Hub pages: `/aram-mayhem/tier-list/`, `/aram-mayhem/meta/`, `/aram-mayhem/how-to-play/`, `/aram-mayhem/beginners-guide/`.
- Patch pages: `/aram-mayhem/patches/26-13/`, `/aram-mayhem/patches/26-14/`.
- Role/category pages: `/aram-mayhem/mage/`, `/aram-mayhem/adc/`, `/aram-mayhem/assassin/`, `/aram-mayhem/fighter/`, `/aram-mayhem/tank/`, `/aram-mayhem/support/`.
- Do not redirect legacy `/champions/{champion}/hex-brawl/` URLs. These are the real multilingual champion detail pages used by visitors.
- Sitemap should index the ARAM Mayhem pages and should not list legacy champion Hex Brawl URLs.
- Static SEO generator: `D:\LOL\scripts\apply-aram-mayhem-seo.mjs`.
- After SEO/static updates, run `node scripts\apply-aram-mayhem-seo.mjs`, deploy with `npx vercel --yes --prod`, then submit the updated sitemap through `node scripts\submit-indexnow.mjs`.

The old `data/hex-brawl/...` directory remains the internal reviewed data source. Do not rename or rewrite that data path unless the import/audit scripts are migrated too.

## 2026-07-06 Routing and Multilingual Detail Page Fix

Important fixed rule after the SEO refactor:

- Homepage champion cards must link to `/champions/{champion}/hex-brawl/?lang={lang}`.
- `/champions/{champion}/hex-brawl/` pages are the user-facing detail pages with five languages: `zh`, `en`, `ja`, `ko`, `es`.
- Language preference is stored with `hexBrawlLanguage` and must persist from homepage to champion detail pages.
- `/aram-mayhem/{champion}-build/`, `/aram-mayhem/{champion}-counter/`, and `/aram-mayhem/{champion}-guide/` are English static SEO landing pages, not replacements for the app detail pages.
- `vercel.json` must not contain redirects from `/champions/{champion}/hex-brawl/` to `/aram-mayhem/{champion}-build/`.
- Augment/hex icons should use CommunityDragon remote assets:
  `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/`
- Do not generate SEO pages with local `/assets/ux/...` augment icon URLs unless those files are actually committed locally.

Regression checks before deploying:

```powershell
node --check scripts\apply-aram-mayhem-seo.mjs
node scripts\apply-aram-mayhem-seo.mjs
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:5173/champions/akali/hex-brawl/?lang=zh"
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:5173/aram-mayhem/akali-build/"
rg -n "champions/.*/hex-brawl" vercel.json
rg -n "raw.communitydragon|/assets/ux" aram-mayhem\akali-build\index.html
```

Expected:

- The first local detail URL returns 200 and contains `supportedLanguages`, `hexBrawlLanguage`, and `raw.communitydragon`.
- The SEO build URL returns 200 and contains `raw.communitydragon`.
- `vercel.json` should not contain champion detail redirects.

Latest confirmed production deploy:

- Commit: `dd3616d` - `Restore multilingual champion detail links`
- Vercel deployment: `https://lol-hex-brawl-backup-608m9q4xh-750827349-6667s-projects.vercel.app`
- Production alias: `https://lol-hex-brawl.vercel.app`
- IndexNow submission after deploy: 533 URLs, `200 OK`

Last updated: 2026-07-06

This document records the important project state so future Codex sessions can recover context after conversation compaction or a new window.

## Project Identity

- Project name: LOL Hex Brawl / 海克斯大乱斗助手
- Local workspace: `D:\LOL`
- Main public site: `https://lol-hex-brawl.vercel.app`
- GitHub backup repository: `https://github.com/crimsonxu6-gif/lol-hex-brawl-backup.git`
- Vercel project: `lol-hex-brawl-backup`
- Primary branch: `main`

## Product Direction

The site is a lightweight, mobile-friendly Hex Brawl guide site for League of Legends.

The core user need is fast lookup during or before a game:

- champion item builds
- recommended augments / hexes
- multiple playstyles when applicable, such as AP, AD, tank, fighter, support
- simple beginner-friendly guidance

The site is not positioned as:

- an Arena helper
- a ranked/ARAM stats site
- an official Riot product
- a fully automated real-time data platform

Avoid using `Arena Build`, `Arena Augments`, or similar wording as the main positioning. The main SEO terms should stay around:

- `lol hex brawl`
- `hex brawl builds`
- `lol augment guide`
- `league of legends augments`
- champion-specific build and augment queries

## Current Site Structure

Important paths:

- `/`
- `/champions/{champion}/hex-brawl/`
- `/guides/`
- `/guides/mage/`
- `/guides/adc/`
- `/guides/assassin/`
- `/guides/fighter/`
- `/guides/tank/`
- `/guides/support/`
- `/tier-list/`
- `/meta/`
- `/sitemap.xml`
- `/robots.txt`

The champion URL structure is already correct and should be kept:

```text
/champions/{champion}/hex-brawl/
```

Example:

```text
/champions/ahri/hex-brawl/
```

## Data Files

Champion data lives in:

```text
D:\LOL\data\hex-brawl\champions\*.json
```

Static champion pages live in:

```text
D:\LOL\champions\{slug}\hex-brawl\index.html
```

Important scripts:

```text
D:\LOL\scripts\apply-aram-mayhem-seo.mjs
D:\LOL\scripts\submit-indexnow.mjs
D:\LOL\scripts\serve-static.mjs
D:\LOL\scripts\local-static-server.mjs
```

`apply-aram-mayhem-seo.mjs` regenerates the ARAM Mayhem static SEO pages, sitemap, robots, role pages, tier/meta pages, patch pages, and Vercel redirect config.

`apply-hex-brawl-seo.mjs` is legacy. Do not use it for the current public SEO direction unless intentionally restoring the old Hex Brawl SEO model.

`submit-indexnow.mjs` reads `sitemap.xml` and submits all URLs to IndexNow.

## Language Behavior

The public site now has five language options in the selector:

- `zh`
- `en`
- `ja`
- `ko`
- `es`

Homepage language state is saved in `localStorage` under `hexBrawlLanguage`.

When a user changes language on `/`, champion card links include `?lang={language}`. Champion detail pages also read `?lang=...`, fall back to `localStorage`, and save future language changes to the same key. This keeps the selected language across all champion detail pages.

Spanish currently localizes the site UI labels. Champion names, build names, and augment names fall back to English when no `localized.es` data exists.

## SEO Rules Already Implemented

Each champion page should use this title template:

```text
{Champion} Hex Brawl Build & Best Augments Guide (2026 Meta)
```

Meta description template:

```text
Find the best Hex Brawl augments and builds for {Champion} in the current meta. Includes tiered recommendations, item paths, and beginner-friendly explanations.
```

Each champion page should include:

- title
- meta description
- meta keywords
- canonical URL
- Open Graph tags
- Twitter card tags
- JSON-LD Article schema
- 3-5 related champion links
- 1 category guide link
- 1 guide hub link
- champion long-tail keywords such as:
  - `{champion} hex brawl build`
  - `best {champion} augments`
  - `{champion} item build guide`
  - `{champion} reroll strategy`
  - `{champion} beginner guide`

Sitemap status:

- `sitemap.xml` contains 183 URLs.
- It contains 173 champion pages.
- It also contains home, guide pages, `/tier-list/`, and `/meta/`.

Robots status:

```text
User-agent: *
Allow: /

Sitemap: https://lol-hex-brawl.vercel.app/sitemap.xml
```

Do not reintroduce visible `待审核`, `审核`, or `复核` wording on public pages.

## Search Engine Setup

Google Search Console:

- Site property: `https://lol-hex-brawl.vercel.app/`
- Verification file deployed:

```text
https://lol-hex-brawl.vercel.app/googlef4acb29991a5690a.html
```

The file content is:

```text
google-site-verification: googlef4acb29991a5690a.html
```

After Google Search Console verification, submit:

```text
https://lol-hex-brawl.vercel.app/sitemap.xml
```

Bing Webmaster:

- User said Bing has also been submitted.
- Keep sitemap URL as above.

IndexNow:

- Key file deployed:

```text
https://lol-hex-brawl.vercel.app/c19f6cfb5cdd176ff02d254e4bd1dc60.txt
```

- Key:

```text
c19f6cfb5cdd176ff02d254e4bd1dc60
```

- Last IndexNow submission:
  - submitted 533 URLs
  - endpoint: `https://api.indexnow.org/indexnow`
  - response: `200 OK`

To resubmit after major content updates:

```powershell
node scripts\submit-indexnow.mjs
```

## Deployment

Production deploy command:

```powershell
npx vercel --yes --prod
```

Production alias should be:

```text
https://lol-hex-brawl.vercel.app
```

After deploy, verify:

```powershell
Invoke-WebRequest -UseBasicParsing https://lol-hex-brawl.vercel.app/robots.txt
Invoke-WebRequest -UseBasicParsing https://lol-hex-brawl.vercel.app/sitemap.xml
Invoke-WebRequest -UseBasicParsing https://lol-hex-brawl.vercel.app/champions/ahri/hex-brawl/
```

Local preview:

```powershell
node scripts\serve-static.mjs
```

Typical local URL:

```text
http://127.0.0.1:5173/
```

## Git Notes

Repository:

```text
https://github.com/crimsonxu6-gif/lol-hex-brawl-backup.git
```

Local Git identity was set only for this repository:

```text
user.name = crimsonxu6-gif
user.email = 750827349@qq.com
```

Recent important commits:

- `65ed372` - Add Hex Brawl SEO pages and sitemap
- `f4db1e4` - Use production domain for SEO metadata
- `2b34b2a` - Add Google Search Console verification file
- `fa48c39` - Add IndexNow submission support

Git line-ending warnings about LF/CRLF are expected on this Windows workspace and were not treated as failures.

## Data Quality Notes

The user manually reviewed many builds and augments. Important patterns:

- Do not import Arena-only augments into Hex Brawl guides.
- Do not show old/deleted augments if the current patch removed them.
- Images from guide screenshots are used only as data collection/reference, not as public detail-page content.
- Public pages should show structured item and augment data, not raw screenshots.
- Official/community full-color icons are preferred where possible.
- If a guide image has multiple builds, preserve them as separate routes/playstyles on the detail page.
- `钢门出装` should be translated/displayed as `肉装` where needed.

The user has already corrected many item recognition mistakes. When adding future champions, prefer:

1. identify item icons from the one-image guide
2. map icons to the project item database
3. compare against known LoL/Hex Brawl item names
4. avoid adding items from the wrong game mode
5. keep an audit page or compact review view before finalizing

## Monetization Notes

Possible monetization path:

- First priority: indexing and organic traffic.
- Then add required trust pages before AdSense:
  - About
  - Contact
  - Privacy Policy
  - Disclaimer
- Google AdSense is the most likely first ad product.
- A custom domain would likely improve SEO and ad review trust compared with only using `vercel.app`.
- Affiliate links may be considered later for gaming peripherals or related tools, but should avoid Riot trademark misuse.

## Recommended Next Steps

1. Finish Google Search Console verification if not already done.
2. Submit `https://lol-hex-brawl.vercel.app/sitemap.xml` in Google Search Console.
3. Confirm Bing Webmaster sitemap submission.
4. Add About / Contact / Privacy Policy / Disclaimer pages.
5. Consider buying a custom domain.
6. After future data changes:
   - run `node scripts\apply-aram-mayhem-seo.mjs` if SEO/static pages need regeneration
   - deploy with `npx vercel --yes --prod`
   - run `node scripts\submit-indexnow.mjs`
