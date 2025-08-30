import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, 'data/images/decks/PAO');
const OUT_FILE = path.join(ROOT, 'data/images/manifest.json');

const IMG_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function parseFilename(file) {
  // Expected like: "12 - AB - Person - action 1.jpg" or "07 - CD - Person.jpg"
  const base = path.basename(file);
  const withoutExt = base.replace(/\.[^.]+$/, '');
  // Capture leading number (allow leading zeros), and optional variant number at end
  const numMatch = withoutExt.match(/^(\d{1,3})\b/);
  const variantMatch = withoutExt.match(/(?:^|[^\d])(\d+)$/);
  const number = numMatch ? numMatch[1].padStart(2, '0') : null;
  const variant =
    variantMatch && numMatch && variantMatch.index > numMatch[0].length
      ? parseInt(variantMatch[1], 10)
      : 1;
  return { number, variant };
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (ent) => {
      const res = path.resolve(dir, ent.name);
      if (ent.isDirectory()) return walk(res);
      return res;
    })
  );
  return files.flat();
}

async function main() {
  try {
    const all = await walk(INPUT_DIR);
    const manifest = {};
    for (const abs of all) {
      const ext = path.extname(abs).toLowerCase();
      if (!IMG_EXTS.has(ext)) continue;
      const rel = path.relative(ROOT, abs).replaceAll('\\', '/');
      const { number, variant } = parseFilename(abs);
      if (!number) continue;
      manifest[number] = manifest[number] || [];
      manifest[number].push({ path: rel, variant });
    }
    // sort each array by variant then lexicographically
    for (const k of Object.keys(manifest)) {
      manifest[k].sort(
        (a, b) => a.variant - b.variant || a.path.localeCompare(b.path)
      );
      // reduce to just paths for client simplicity
      manifest[k] = manifest[k].map((x) => x.path);
    }
    await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
    await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(
      `Wrote manifest with ${Object.keys(manifest).length} keys -> ${path.relative(ROOT, OUT_FILE)}`
    );
  } catch (err) {
    console.error('Failed to generate manifest:', err);
    process.exit(1);
  }
}

main();
