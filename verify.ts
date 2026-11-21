import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { textWidth } from './bitmap-font.ts';
import { renderEdition } from './main.ts';

const titles = [
  'Climate summit runs into Saturday with no deal',
  'Five Houthi missiles shot down over Saudi Arabia',
  'Magnitude 6.7 earthquake shakes central Peru',
  'Zelensky calls Putin an enemy and a killer',
  "Tanker struck by projectile near Oman's Khasab",
  'Gas pipeline blast kills four at Basra power plant',
  'Jet lands safely in Davao after engine fire alert',
  'China and Australia pledge AI and green trade ties',
  'Japan reaffirms Taiwan policy after China snub',
  'Bitcoin slides near $55,200 amid $2.5B liquidations',
  'Verstappen warned after Las Vegas practice clash',
  'KL Rahul hits 136 to put India in command in Test',
  'Youth and labor protests sweep 25 European nations',
  'African football leaders convene 54 nations in Abuja',
  'Morocco commits €366M to build defense industry',
  'BepiColombo enters Mercury orbit after 8-year trip',
];
const kpi = [
  ['Day 13', 'COP31 climate talks run into overtime in Antalya'],
  ['5', 'Houthi ballistic missiles intercepted over two days'],
  ['6.7', 'Magnitude of earthquake shaking central Peru'],
  ['146', 'People safe after Air Niugini emergency landing in Davao'],
  ['$55,200', 'Bitcoin low Saturday amid $2.53B in liquidations'],
  ['136', "KL Rahul's century score putting India ahead in Wellington"],
];
const dateCheck = "Left out as Friday 20 November's news: Wall Street's sharp tech selloff (Nasdaq -5.3%), Russia's barrage hitting three Kyiv bridges, the passing of former South African Deputy President Phumzile Mlambo-Ngcuka, and the $7.25bn Bayer Roundup settlement. Older still: the ADGM Binance asset-freeze order (18 Nov).";

const image = process.argv[2];
if (!image) throw new Error('Usage: node verify.ts <entry.png>');
const format = JSON.parse(execFileSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
  fileURLToPath(new URL('./verify-png.ts', import.meta.url)), image, '1024', '1024'], { encoding: 'utf8' }));
const data = JSON.parse(readFileSync(new URL('./news-data.json', import.meta.url), 'utf8'));
const { png, proof } = renderEdition();
assert(readFileSync(image).equals(png), 'The supplied PNG differs from the renderer');
assert.deepEqual(data.stories.map((s: { title: string }) => s.title), titles);
assert.deepEqual(proof.cards.map(s => s.titleLines.join(' ')), titles);
assert.equal(proof.subhead, titles.slice(0, 3).join(' · '));
assert.deepEqual(data.kpi.map((item: { value: string; label: string }) => [item.value, item.label]), kpi);
assert.deepEqual(proof.kpi.map(item => [item.value, item.lines.join(' ')]), kpi);
assert.equal(proof.dateCheck.join(' '), dateCheck);
assert.equal(data.masthead, 'THE WORLD IN ONE DAY');
assert.equal(data.date, 'SATURDAY 21 NOVEMBER 2026');
assert.deepEqual(proof.cards.map(s => s.id), Array.from({ length: 16 }, (_, i) => i + 1));

const expectedCount = [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
const textHeight = (count: number) => Math.round(9 + (count - 1) * 11.5);
function minimumLines(content: string, width: number): number {
  let used = 0;
  let lines = 1;
  for (const word of content.split(' ')) {
    const advance = textWidth(word, 9);
    assert(advance <= width);
    if (used + 4 + advance > width && used > 0) { lines++; used = 0; }
    used += advance + (used > 0 ? 4 : 0); // blank glyph and its two adjacent advances
  }
  return lines;
}

const disclosures = proof.cards.map(card => {
  const story = data.stories[card.id - 1];
  assert.equal(story.id, card.id);
  const parts = (story.summary as string).split(/(?<!\bU\.S\.)(?<!\ba\.m\.)(?<=\.) (?=[A-Z])/);
  assert.equal(parts.length, expectedCount[card.id - 1]);
  assert.equal(card.sentenceCount, parts.length);
  const omitted = parts.map((_, i) => i + 1).filter(i => !card.kept.includes(i));
  assert(omitted.length === 0 || (card.kept.length === 1 && [1, 2].includes(card.kept[0])));
  const keptText = card.kept.map(index => parts[index - 1]).join(' ');
  assert.equal(card.kickerLines.join(' '), card.attribution === 'kicker' ? `${story.kicker} ${story.sources}` : story.kicker);
  assert.equal(card.paragraphLines.join(' '), card.attribution === 'paragraph' ? `${keptText} ${story.sources}` : keptText);
  assert(card.paragraphLines.every(line => textWidth(line, 9) <= card.paragraphWidth));
  assert(textHeight(card.paragraphLines.length) <= card.paragraphHeight);
  if (omitted.length) {
    assert(textHeight(minimumLines(`${story.summary} ${story.sources}`, card.paragraphWidth)) > card.paragraphHeight,
      `Full copy with attribution would fit story ${card.id}`);
  }
  if (card.kept.length === 1 && card.kept[0] === 2) {
    assert(textHeight(minimumLines(`${parts[0]} ${story.sources}`, card.paragraphWidth)) > card.paragraphHeight,
      `First sentence with attribution would fit story ${card.id}`);
  }
  return { id: card.id, kept: card.kept, omitted, attribution: card.attribution };
});

console.log(JSON.stringify({ png: format, verbatimTitles: titles.length, exactKpi: kpi.length,
  exactDateCheck: true, disclosures }, null, 2));
