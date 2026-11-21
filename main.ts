import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drawText, textWidth } from './bitmap-font.ts';
import type { TextStyle } from './bitmap-font.ts';
import { illustrate } from './illustrations.ts';
import { locate } from './locator.ts';
import { Raster, rgb } from './raster.ts';
import type { RGB } from './raster.ts';

const regions = {
  Europe: '1E3A5F', 'Asia-Pacific': '8B1E24', World: '374151', 'Middle East': '743B29',
  Americas: '155E75', Science: '4338CA', Africa: '166534',
};
type Region = keyof typeof regions;
type Story = { id: number; hero?: boolean; region: Region; pin: string; kicker: string; title: string; summary: string; sources: string };
type KPI = { value: string; label: string };
type Edition = { masthead: string; date: string; edition: string; stories: Story[]; kpi: KPI[];
  dateCheck: string; footer: string; footerCredit: string };
export type CardProof = { id: number; titleLines: string[]; kickerLines: string[]; paragraphLines: string[];
  paragraphWidth: number; paragraphHeight: number; sentenceCount: number; kept: number[];
  attribution: 'paragraph' | 'kicker' };

const paper = rgb('#F6F3EC');
const ink = rgb('#141414');
const red = rgb('#8B1E24');
const softInk = rgb('#4B4944');
const hairline = rgb('#C5BCAF');
const ivory = rgb('#FFFAEE');
const bold = { face: 'bold' } as const;
const display = { face: 'display' } as const;
const body = { face: 'regular', tracking: 0 } as const;
const margin = 24;
const breadth = 976;
const gutter = 8;

export function wrap(text: string, width: number, size: number, style: TextStyle = body): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (textWidth(word, size, style) > width) throw new Error(`Unbreakable word exceeds ${width} px: ${word}`);
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, style) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function sentences(text: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (const match of text.matchAll(/[.!?] (?=[A-Z])/g)) {
    const end = match.index + 1;
    const candidate = text.slice(start, end);
    // An initialism or time abbreviation is not a sentence in this edition.
    if (/(?:\b(?:[A-Z]\.){2,}|\b[ap]\.m\.)$/.test(candidate)) continue;
    parts.push(candidate);
    start = end + 1;
  }
  parts.push(text.slice(start));
  return parts;
}

function text(page: Raster, line: string, x: number, y: number, size: number, color: RGB,
  style: TextStyle = body, available = page.width - x): void {
  if (x < 0 || y < 0 || textWidth(line, size, style) > available || Math.round(y + size) > page.height) {
    throw new Error(`Text outside box at (${x}, ${y}): ${line}`);
  }
  drawText((left, top, w, h) => page.rect(left, top, w, h, color), line, x, y, size, style);
}

function block(page: Raster, lines: readonly string[], x: number, y: number, width: number, size: number,
  leading: number, color: RGB, style: TextStyle = body): void {
  lines.forEach((line, i) => text(page, line, x, y + i * leading, size, color, style, width));
}

function center(page: Raster, copy: string, x: number, y: number, width: number, size: number, color: RGB, style: TextStyle): void {
  const used = textWidth(copy, size, style);
  if (used > width) throw new Error(`Centered text exceeds box: ${copy}`);
  text(page, copy, x + Math.floor((width - used) / 2), y, size, color, style);
}

function right(page: Raster, copy: string, edge: number, y: number, size: number, color: RGB, style: TextStyle): void {
  text(page, copy, edge - textWidth(copy, size, style), y, size, color, style);
}

type Box = { x: number; y: number; width: number; height: number };

function columns(x: number, y: number, width: number, height: number, count: number, gap: number): Box[] {
  const space = width - (count - 1) * gap;
  return Array.from({ length: count }, (_, i) => ({ x: x + Math.round(i * space / count) + i * gap, y,
    width: Math.round((i + 1) * space / count) - Math.round(i * space / count), height }));
}

function headline(story: Story, measure: number, size: number): string[] {
  const lines = wrap(story.title, measure, size, bold);
  if (!story.hero || lines.length !== 2) return lines;
  // The three display stories break at a phrase rather than leaving a
  // single trailing word (deal, Arabia, Peru) on the second line.
  const words = story.title.split(' ');
  const deck = [words.slice(0, 3).join(' '), words.slice(3).join(' ')];
  return deck.every(line => textWidth(line, size, bold) <= measure) ? deck : lines;
}

function withSources(copy: string, sources: string, measure: number): string[] {
  const lines = wrap(copy, measure, 9);
  const last = `${lines[lines.length - 1]} ${sources}`;
  if (textWidth(last, 9, body) <= measure) return [...lines.slice(0, -1), last];
  const packed = wrap(`${copy} ${sources}`, measure, 9);
  // Keep an attribution intact when doing so does not cost a line.
  if (textWidth(sources, 9, body) <= measure && packed.length > lines.length) return [...lines, sources];
  return packed;
}

function card(page: Raster, story: Story, box: Box, artHeight: number): CardProof {
  const { x, y, width, height } = box;
  const hero = story.hero === true;
  const color = rgb(regions[story.region]);
  const pad = hero ? 9 : 6;
  const measure = width - 2 * pad;
  const titleSize = hero ? 14 : 11;
  const titleLeading = hero ? 16 : 13;
  const bodyLeading = 11.5;
  const kickerLeading = 10.5;
  const titleLines = headline(story, measure, titleSize);
  const complete = sentences(story.summary);
  const candidates = [complete.map((_, i) => i), ...complete.slice(0, 2).map((_, i) => [i])];
  const attempts = candidates.flatMap(keep => (['paragraph', 'kicker'] as const).map(attribution => {
    const kick = attribution === 'kicker' ? `${story.kicker} ${story.sources}` : story.kicker;
    const kickerLines = wrap(kick, measure, 9, bold);
    const kickerY = hero ? y + artHeight - 14 : y + artHeight + 2;
    const titleY = hero ? y + artHeight + 6 : Math.ceil(kickerY + (kickerLines.length - 1) * kickerLeading + 11);
    const paragraphY = titleY + (titleLines.length - 1) * titleLeading + titleSize + (hero ? 4 : 3);
    const content = keep.map(index => complete[index]).join(' ');
    const paragraphLines = attribution === 'paragraph' ? withSources(content, story.sources, measure) : wrap(content, measure, 9);
    const paragraphHeight = y + height - 4 - paragraphY;
    return { keep, attribution, kickerLines, kickerY, titleY, paragraphY, paragraphLines, paragraphHeight,
      fits: (!hero || kickerLines.length === 1) && Math.round(9 + (paragraphLines.length - 1) * bodyLeading) <= paragraphHeight };
  }));
  const fit = attempts.find(candidate => candidate.fits);
  if (!fit) throw new Error(`No full sentence fits in story ${story.id}`);

  // Select the copy with the original measure and leading. Then give back
  // spare depth as air only; the fitted words and their line breaks stay put.
  const gaps = fit.paragraphLines.length - 1;
  const spare = hero ? 0 : Math.max(0, fit.paragraphHeight - 9 - gaps * bodyLeading);
  const opening = Math.min(4, Math.floor(spare / 4));
  const spacedLeading = bodyLeading + (gaps ? Math.min(3, Math.floor(2 * (spare - opening) / gaps) / 2) : 0);

  page.rect(x, y, width, height, rgb(hero ? '#EEE9DD' : '#F2EEE4'));
  page.paste(illustrate(story.id, width, artHeight - (hero ? 17 : 0)), x, y);
  if (hero) page.rect(x, y + artHeight - 17, width, 17, color);
  else page.rect(x, y + artHeight, width, 1, color);
  const label = String(story.id);
  if (hero) {
    page.rect(x + width - 27, y + artHeight - 13, 1, 9, rgb('#D9CBC0'));
    center(page, label, x + width - 24, y + artHeight - 13, 17, 9, ivory, bold);
  } else {
    page.rect(x + 5, y + 4, 18, 13, color);
    center(page, label, x + 5, y + 6, 18, 9, ivory, bold);
  }
  block(page, fit.kickerLines, x + pad, fit.kickerY, measure, 9, kickerLeading, hero ? ivory : color, bold);
  block(page, titleLines, x + pad, fit.titleY, measure, titleSize, titleLeading, ink, bold);
  block(page, fit.paragraphLines, x + pad, fit.paragraphY + opening, measure, 9, spacedLeading, ink);
  page.rect(x, y + height - 1, width, 1, hairline);
  return { id: story.id, titleLines, kickerLines: fit.kickerLines, paragraphLines: fit.paragraphLines,
    paragraphWidth: measure, paragraphHeight: fit.paragraphHeight, sentenceCount: complete.length,
    kept: fit.keep.map(i => i + 1), attribution: fit.attribution };
}

export function renderEdition() {
  const data: Edition = JSON.parse(readFileSync(new URL('./news-data.json', import.meta.url), 'utf8'));
  const page = new Raster(1024, 1024, paper);
  const end = margin + breadth;
  const cards: CardProof[] = [];
  const hero = data.stories.filter(story => story.hero);
  const subhead = hero.map(story => story.title).join(' · ');

  page.rect(margin, 24, breadth, 3, red);
  text(page, data.masthead, margin, 31, 11, red, bold);
  right(page, data.edition, end, 32, 9, ink, bold);
  page.rect(margin, 44, breadth, 1, hairline);
  center(page, data.date, margin, 47, breadth, 44, ink, display);
  center(page, subhead, margin, 99, breadth, 11, ink, bold);
  page.rect(margin, 115, breadth, 1, ink);

  const kpiLines = columns(margin, 122, breadth, 65, 6, 0).map(({ x, y, width, height }, i) => {
    const { value, label } = data.kpi[i];
    page.rect(x, y, width, height, rgb(i % 2 ? '#F0EBDD' : '#EEE7DA'));
    if (i) page.rect(x, y + 6, 1, height - 12, hairline);
    text(page, value, x + 9, y + 3, 24, red, bold, width - 18);
    const lines = wrap(label, width - 18, 9);
    if (lines.length > 3) throw new Error(`KPI ${i + 1} does not fit`);
    block(page, lines, x + 9, y + 30, width - 18, 9, 10.5, ink);
    return { value, lines };
  });

  let regionX = margin;
  for (const region of Object.keys(regions) as Region[]) {
    const count = data.stories.filter(story => story.region === region).length;
    const width = 61 * count;
    page.rect(regionX, 193, width, 22, rgb(regions[region]));
    center(page, `${region.toUpperCase()} ${count}`, regionX, 199, width, 9, ivory, bold);
    regionX += width;
  }
  if (regionX !== end) throw new Error('Region counts do not match the breadth');

  columns(margin, 224, breadth, 191, 3, gutter).forEach((box, i) => cards.push(card(page, hero[i], box, 76)));
  [[423, 145], [576, 155]].forEach(([y, height], row) => {
    columns(margin, y, breadth, height, 5, gutter)
      .forEach((box, i) => cards.push(card(page, data.stories[3 + row * 5 + i], box, 33)));
  });
  const mapWidth = 404;
  const atlasY = 739;
  const atlasHeight = 178;
  page.paste(locate(mapWidth, atlasHeight, data.stories.map(story => rgb(regions[story.region]))), margin, atlasY);
  columns(margin + mapWidth + gutter, atlasY, breadth - mapWidth - gutter, atlasHeight, 3, gutter)
    .forEach((box, i) => cards.push(card(page, data.stories[13 + i], box, 33)));

  page.rect(margin, 923, breadth, 50, red);
  page.rect(margin + 1, 924, breadth - 2, 48, rgb('#EFE6DB'));
  text(page, 'DATE CHECK', margin + 10, 942, 12, red, bold);
  page.rect(margin + 112, 931, 1, 34, red);
  const dateSize = 10.5;
  const dateLines = wrap(data.dateCheck, breadth - 137, dateSize);
  if (dateLines.length > 3) throw new Error('DATE CHECK does not fit');
  const dateY = 923 + Math.floor((50 - (dateLines.length - 1) * 13 - dateSize) / 2);
  block(page, dateLines, margin + 124, dateY, breadth - 137, dateSize, 13, ink);
  page.rect(margin, 982, breadth, 1, ink);
  text(page, data.footer, margin, 989, 9, ink);
  right(page, data.footerCredit, end, 989, 9, softInk, body);
  return { png: page.png(), proof: { cards, subhead, kpi: kpiLines, dateCheck: dateLines } };
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { png } = renderEdition();
  writeFileSync(join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png'), png);
}
