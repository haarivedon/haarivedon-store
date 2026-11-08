import { unlink } from "node:fs/promises";
import sharp from "sharp";

/**
 * One-off: the founder cutouts/reading shots were committed as 1.5–1.9 MB PNGs,
 * which makes the hero slow and the image optimiser abort in the browser.
 * Re-encode them to WebP (transparency preserved) at a sensible width.
 */
const dir = "../web/public/images";
const files = ["founder-cutout", "founder-cutout-2", "founder-reading"];

async function main() {
  for (const f of files) {
    const info = await sharp(`${dir}/${f}.png`)
      .resize({ width: 1100, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(`${dir}/${f}.webp`);
    await unlink(`${dir}/${f}.png`);
    console.log(
      `${f}.png -> ${f}.webp  (${(info.size / 1024).toFixed(0)} KB, ${info.width}x${info.height})`,
    );
  }
}

void main();
