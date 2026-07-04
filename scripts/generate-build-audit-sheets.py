import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "captures" / "build-audit-sheets"
GUIDE_DIR = ROOT / "captures" / "guide-source-16.13"
ITEM_DIR = ROOT / ".cache" / "ddragon-16.13.1-items"
DATA_DIR = ROOT / "data" / "hex-brawl" / "champions"
SYNC_SCRIPT = ROOT / "scripts" / "sync-hex-brawl-16-13.mjs"


def mappings():
    text = SYNC_SCRIPT.read_text(encoding="utf-8")
    for guide, slug, route in re.findall(r'\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]', text):
        if not guide.startswith("guide-") or not guide.endswith(".jpg"):
            continue
        yield {"guide": guide, "slug": slug, "route": route}


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None


def related_builds(mapping, data):
    builds = data.get("builds") or []
    if not builds:
        return []

    slug = mapping["slug"]
    route = mapping["route"]
    occurrence_index = mapping["occurrence_index"]
    occurrence_count = mapping["occurrence_count"]

    if occurrence_count <= 1:
        return builds

    if slug == "trundle":
        return builds[:2] if occurrence_index == 0 else builds[2:]

    if slug == "miss-fortune":
        return builds[:1] if occurrence_index == 0 else builds[1:]

    if route == "alt" and len(builds) > 1:
        return builds[1:]

    return builds[:1]


def draw_items(draw, canvas, x, y, build):
    draw.text((x, y), build.get("key", "build"), fill=(213, 177, 124))
    for index, item_id in enumerate((build.get("items") or [])[:6]):
        item_path = ITEM_DIR / f"{item_id}.png"
        if not item_path.exists():
            continue
        icon = Image.open(item_path).convert("RGB").resize((34, 34), Image.LANCZOS)
        ix = x + index * 36
        iy = y + 20
        canvas.paste(icon, (ix, iy))
        draw.text((ix, iy + 36), str(item_id), fill=(240, 230, 216))


def draw_card(draw, canvas, mapping, x, y):
    draw.rectangle([x, y, x + 639, y + 219], fill=(24, 19, 15), outline=(91, 73, 56))
    draw.text((x + 10, y + 8), f"{mapping['guide']} / {mapping['slug']} / {mapping['route']}", fill=(240, 230, 216))

    guide = Image.open(GUIDE_DIR / mapping["guide"]).convert("RGB")
    gw, gh = guide.size
    crop = guide.crop((int(gw * 0.04), int(gh * 0.15), int(gw * 0.88), int(gh * 0.33)))
    crop = crop.resize((380, 150), Image.LANCZOS)
    canvas.paste(crop, (x + 10, y + 34))

    data = load_json(DATA_DIR / f"{mapping['slug']}.json") or {}
    builds = related_builds(mapping, data)
    if not builds:
        draw.text((x + 410, y + 36), "no build", fill=(213, 177, 124))
        return

    for build_index, build in enumerate(builds[:3]):
        draw_items(draw, canvas, x + 410, y + 36 + build_index * 58, build)


def add_occurrences(entries):
    counts = {}
    for entry in entries:
        counts[entry["slug"]] = counts.get(entry["slug"], 0) + 1

    seen = {}
    for entry in entries:
        slug = entry["slug"]
        entry["occurrence_index"] = seen.get(slug, 0)
        entry["occurrence_count"] = counts[slug]
        seen[slug] = entry["occurrence_index"] + 1


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    entries = list(mappings())
    add_occurrences(entries)
    for page in range((len(entries) + 7) // 8):
        canvas = Image.new("RGB", (1280, 880), (18, 15, 12))
        draw = ImageDraw.Draw(canvas)
        chunk = entries[page * 8 : page * 8 + 8]
        for index, mapping in enumerate(chunk):
            draw_card(draw, canvas, mapping, (index % 2) * 640, (index // 2) * 220)
        canvas.save(OUT_DIR / f"audit-{page + 1:02d}.jpg", quality=92)
    print(f"Wrote {(len(entries) + 7) // 8} audit sheets to {OUT_DIR}")


if __name__ == "__main__":
    main()
