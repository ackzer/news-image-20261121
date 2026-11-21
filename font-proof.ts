import { realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drawText, textWidth } from './bitmap-font.ts';
import { Raster, rgb } from './raster.ts';
import type { RGB } from './raster.ts';

const output = process.argv[2];
if (!output) throw new Error('Usage: node font-proof.ts <existing directory outside the repo>');
const folder = realpathSync(output);
const repo = realpathSync(fileURLToPath(new URL('.', import.meta.url)));
const relation = relative(repo, folder);
if (!(relation === '..' || relation.startsWith(`..${sep}`) || isAbsolute(relation))) {
  throw new Error('Write the proof outside the repository');
}

const paper = new Raster(816, 162, rgb('#F6F3EC'));
const ink = rgb('#141414');
const red = rgb('#8B1E24');
const margin = 24;
const measure = paper.width - 2 * margin;

function line(text: string, y: number, size: number, color: RGB, centered = false): void {
  const width = textWidth(text, size);
  if (width > measure) throw new Error(`Proof text overflows at ${size} px`);
  const x = centered ? margin + Math.floor((measure - width) / 2) : margin;
  drawText((left, top, w, h) => paper.rect(left, top, w, h, color), text, x, y, size);
}

paper.rect(margin, 18, measure, 2, red);
line('SATURDAY 21 NOVEMBER 2026', 27, 44, ink, true);
paper.rect(margin, 78, measure, 1, ink);
line('Climate summit runs into Saturday with no deal', 96, 14, ink);
line("UN COP31 negotiations in Antalya stretched into overtime on Day 13 after missing Friday's scheduled close without an agreement.", 118, 9, ink);
paper.rect(margin, 142, measure, 1, red);

writeFileSync(join(folder, 'test-font.png'), paper.png());
