// A proportional nine-row face. Rows 1–7 carry the capitals, 3–7
// carry the lowercase x-height, and row 8 is reserved for descenders.
type Glyph = { width: number; rows: readonly string[]; top: number };
type Fill = (x: number, y: number, width: number, height: number) => void;
export type TextStyle = Readonly<{
  face?: 'regular' | 'bold' | 'display';
  tracking?: 0 | 1; // Additional pixels per gap, after scaling.
}>;

const glyphs = new Map<string, Glyph>();

function add(letter: string, top: number, drawing: string) {
  const rows = drawing.split('/');
  const width = rows[0].length;
  if (glyphs.has(letter) || top < 0 || top + rows.length > 9 ||
      !rows.every(row => row.length === width && /^[.#]+$/.test(row))) {
    throw new Error(`Invalid glyph: ${letter}`);
  }
  glyphs.set(letter, { width, rows, top });
}

const capitals: Record<string, string> = {
  A: '..#../.#.#./#...#/#...#/#####/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.####/#..../#..../#..../#..../#..../.####',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.####/#..../#..../#..##/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '###/.#./.#./.#./.#./.#./###',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#....#/##..##/#.##.#/#.##.#/#....#/#....#/#....#',
  N: '#...#/##..#/##..#/#.#.#/#..##/#..##/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#...#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/.#.#./.#.#./..#..',
  W: '#.....#/#.....#/#.....#/#..#..#/#..#..#/.#.#.#./..#.#..',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',
};
for (const [letter, rows] of Object.entries(capitals)) add(letter, 1, rows);

const lowercase: Record<string, [number, string]> = {
  a: [3, '###./...#/.###/#..#/.###'],
  b: [1, '#.../#.../###./#..#/#..#/#..#/###.'],
  c: [3, '.###/#.../#.../#.../.###'],
  d: [1, '...#/...#/.###/#..#/#..#/#..#/.###'],
  e: [3, '.##./#..#/####/#.../.###'],
  f: [1, '.##/.#./###/.#./.#./.#./.#.'],
  g: [3, '.###/#..#/#..#/.###/...#/###.'],
  h: [1, '#.../#.../###./#..#/#..#/#..#/#..#'],
  i: [1, '#/./#/#/#/#/#'],
  j: [1, '..#/.../..#/..#/..#/..#/#.#/.#.'],
  k: [1, '#.../#.../#..#/#.#./##../#.#./#..#'],
  l: [1, '#../#../#../#../#../#../.##'],
  m: [3, '#####./#.#..#/#.#..#/#.#..#/#.#..#'],
  n: [3, '###./#..#/#..#/#..#/#..#'],
  o: [3, '.##./#..#/#..#/#..#/.##.'],
  p: [3, '###./#..#/#..#/#..#/###./#...'],
  q: [3, '.###/#..#/#..#/#..#/.###/...#'],
  r: [3, '##./#.#/#../#../#..'],
  s: [3, '.###/#.../.##./...#/###.'],
  t: [2, '.#./###/.#./.#./.#./..#'],
  u: [3, '#..#/#..#/#..#/#..#/.###'],
  v: [3, '#...#/#...#/#...#/.#.#./..#..'],
  w: [3, '#...#/#...#/#.#.#/#.#.#/.#.#.'],
  x: [3, '#...#/.#.#./..#../.#.#./#...#'],
  y: [3, '#..#/#..#/#..#/.###/...#/###.'],
  z: [3, '####/..#./.#../#.../####'],
};
for (const [letter, [top, rows]] of Object.entries(lowercase)) add(letter, top, rows);

const figures = [
  '.###./#...#/#...#/#.#.#/#...#/#...#/.###.',
  '.##../###../..#../..#../..#../..#../#####',
  '.###./#...#/....#/...#./..#../.#.../#####',
  '####./....#/....#/.###./....#/....#/####.',
  '...#./..##./.#.#./#..#./#####/...#./...#.',
  '#####/#..../#..../####./....#/....#/####.',
  '.###./#..../#..../####./#...#/#...#/.###.',
  '#####/....#/...#./...#./..#../..#../.#...',
  '.###./#...#/#...#/.###./#...#/#...#/.###.',
  '.###./#...#/#...#/.####/....#/....#/.###.',
];
figures.forEach((rows, n) => add(String(n), 1, rows));

const marks: Record<string, [number, string]> = {
  ' ': [7, '..'],
  '.': [7, '#'],
  ',': [7, '.#/#.'],
  ':': [4, '#/././#'],
  ';': [4, '.#/../../.#/#.'],
  '!': [1, '#/#/#/#/#/./#'],
  '?': [1, '.##./#..#/...#/..#./.#../..../.#..'],
  '·': [4, '#'],
  '•': [3, '.#./###/.#.'],
  '-': [4, '###'],
  '–': [4, '####'],
  '—': [4, '######'],
  '_': [8, '####'],
  "'": [1, '#/#'],
  '’': [1, '.#/.#/#.'],
  '‘': [1, '.#/#./#.'],
  '"': [1, '#.#/#.#'],
  '“': [1, '.#..#/#..#./#..#.'],
  '”': [1, '.#..#/.#..#/#..#.'],
  '(': [1, '..#/.#./#../#../#../.#./..#'],
  ')': [1, '#../.#./..#/..#/..#/.#./#..'],
  '[': [1, '###/#../#../#../#../#../###'],
  ']': [1, '###/..#/..#/..#/..#/..#/###'],
  '/': [1, '....#/...#./...#./..#../.#.../.#.../#....'],
  '+': [2, '..#../..#../#####/..#../..#..'],
  '=': [3, '####/..../####'],
  '%': [1, '##..#./##..#./...#../..#.../.#..##/.#..##/#.....'],
  '$': [0, '..#../.####/#.#../#.#../.###./..#.#/..#.#/####./..#..'],
  '€': [1, '..###/.#.../.#.../####./.#.../####./..###'],
  '&': [1, '.##../#..#./#.#../.##../#..##/#..#./.##.#'],
  '#': [1, '.#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.'],
  '@': [1, '.####./#....#/#.##.#/#.#.##/#.###./#...../.####.'],
  'é': [0, '..#./.#../..../.##./#..#/####/#.../.###'],
  'í': [0, '.#/#./../#./#./#./#./#.'],
  'á': [0, '..#./.#../..../###./...#/.###/#..#/.###'],
  'ü': [1, '#..#/..../#..#/#..#/#..#/#..#/.###'],
  'É': [0, '...#./..#../#####/#..../####./#..../#..../#####'],
  'Í': [0, '..#/.#./###/.#./.#./.#./.#./###'],
  'Á': [0, '...#./..#../..#../.#.#./#...#/#####/#...#/#...#'],
  'Ü': [0, '.#.#./...../#...#/#...#/#...#/#...#/#...#/.###.'],
};
for (const [letter, [top, rows]] of Object.entries(marks)) add(letter, top, rows);

// Give supported stems one more cell of ink without shifting the origin or
// filling the last blank cell between strokes. Isolated dots stay isolated.
function embolden(letter: string, glyph: Glyph): Glyph {
  if (!/^[\p{L}\p{N}$€]$/u.test(letter)) return glyph;
  const { width, rows } = glyph;
  return { ...glyph, rows: rows.map((row, index) => {
    // Keep a full paper moat around the counter mark, even in bold zero.
    if (letter === '0' && index >= 2 && index <= 4) return row;
    const ink = [...row];
    const above = rows[index - 1];
    const below = rows[index + 1];
    const supported = (col: number) => above?.[col] === '#' || below?.[col] === '#';
    for (let x = 0; x < width; x++) {
      if (row[x] !== '#' || row[x - 1] === '#' || row[x + 1] === '#') continue;
      for (const side of [1, -1]) {
        const next = x + side;
        if (ink[next] !== '.' || ink[next + side] === '#') continue;
        if (!supported(x) && !supported(next)) continue;
        ink[next] = '#';
        break;
      }
    }
    return ink.join('');
  }) };
}

const bold = new Map<string, Glyph>();
for (const [letter, glyph] of glyphs) bold.set(letter, embolden(letter, glyph));

// Date cuts: slab feet, squared terminal flicks, and unfilled bowls.
// Glyphs not cut for the date line use the regular face.
const dateCuts: Record<string, string> = {
  A: '..#../.#.#./#...#/#...#/#####/#...#/##.##',
  B: '####./.#..#/.#..#/.###./.#..#/.#..#/####.',
  D: '####./.#..#/.#..#/.#..#/.#..#/.#..#/####.',
  E: '#####/.#..#/.#.../.###./.#.../.#..#/#####',
  M: '##..##/##..##/#.##.#/#.##.#/#....#/#....#/##..##',
  N: '##.##/##..#/##..#/#.#.#/#..##/#..##/##.##',
  O: '.###./##..#/#...#/#...#/#...#/#..##/.###.',
  R: '####./.#..#/.#..#/.###./.#.#./.#..#/###.#',
  S: '.####/#...#/#..../.###./....#/#...#/####.',
  T: '#####/#.#.#/..#../..#../..#../..#../.###.',
  U: '##.##/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '##.##/#...#/#...#/#...#/.#.#./.#.#./..#..',
  Y: '##.##/#...#/.#.#./..#../..#../..#../.###.',
  0: '.###./##..#/#...#/#.#.#/#...#/#..##/.###.',
  1: '.##../####./..##./..##./..##./..##./#####',
  2: '.###./#...#/....#/...#./..#../.#..#/#####',
  6: '.####/#...#/#..../####./#...#/#...#/.###.',
};
const display = new Map<string, Glyph>();
for (const [letter, cut] of Object.entries(dateCuts)) {
  const base = glyphs.get(letter);
  const rows = cut.split('/');
  if (!base || rows.length !== base.rows.length || rows.some(row => row.length !== base.width || !/^[.#]+$/.test(row))) {
    throw new Error(`Invalid display cut: ${letter}`);
  }
  display.set(letter, { ...base, rows });
}

function lookup(letter: string, face: TextStyle['face']): Glyph {
  const alternate = face === 'bold' ? bold.get(letter) : face === 'display' ? display.get(letter) : undefined;
  const glyph = alternate ?? glyphs.get(letter);
  if (!glyph) throw new Error(`No bitmap glyph for ${JSON.stringify(letter)}`);
  return glyph;
}

function layout(text: string, step: number, style: TextStyle, paint?: (glyph: Glyph, offset: number) => void): number {
  let advance = 0;
  let previous = '';
  for (const letter of text.normalize('NFC')) {
    const glyph = lookup(letter, style.face);
    if (previous) {
      // The open shoulder of r must not join n's arch even in compact body.
      const needsAir = previous === 'r' && letter === 'n' ? 1 : 0;
      advance += step + Math.max(needsAir, style.tracking ?? 0);
    }
    paint?.(glyph, advance);
    advance += glyph.width * step;
    previous = letter;
  }
  return advance;
}

// Sizes name the em, not the cap height. Snap edges in page coordinates,
// not each character's advance, to keep measuring and drawing in agreement.
export function textWidth(text: string, size: number, style: TextStyle = {}): number {
  return Math.round(layout(text, size / 9, style));
}

export function drawText(fill: Fill, text: string, x: number, y: number, size: number, style: TextStyle = {}): void {
  const step = size / 9;
  if (step < 1) throw new Error('Bitmap text cannot be rendered below 9 px');
  layout(text, step, style, ({ width, rows, top }, offset) => {
    for (const [rowIndex, row] of rows.entries()) {
      const rowY = Math.round(y + (top + rowIndex) * step);
      const height = Math.round(y + (top + rowIndex + 1) * step) - rowY;
      for (let col = 0; col < width; col++) {
        if (row[col] !== '#') continue;
        const left = Math.round(x + offset + col * step);
        const right = Math.round(x + offset + (col + 1) * step);
        fill(left, rowY, right - left, height);
      }
    }
  });
}
