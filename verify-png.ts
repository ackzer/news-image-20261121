import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { crc32, inflateSync } from 'node:zlib';

const [filename, widthText, heightText] = process.argv.slice(2);
if (!filename || !widthText || !heightText) {
  throw new Error('Usage: node verify-png.ts <png> <width> <height>');
}
const width = Number(widthText);
const height = Number(heightText);
assert(Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0);
const bytes = readFileSync(filename);
assert(bytes.length <= 1024 ** 2, 'PNG exceeds 1 MiB');
assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
const kinds: string[] = [];
const compressed: Buffer[] = [];
let offset = 8;
while (offset < bytes.length) {
  assert(offset + 12 <= bytes.length, 'Truncated chunk header');
  const length = bytes.readUInt32BE(offset);
  const end = offset + 8 + length;
  assert(end + 4 <= bytes.length, 'Truncated chunk payload or CRC');
  const kind = bytes.toString('ascii', offset + 4, offset + 8);
  const data = bytes.subarray(offset + 8, end);
  assert.equal(bytes.readUInt32BE(end), crc32(bytes.subarray(offset + 4, end)), `Bad CRC in ${kind}`);
  switch (kind) {
    case 'IHDR':
      assert.equal(length, 13);
      assert.equal(data.readUInt32BE(0), width);
      assert.equal(data.readUInt32BE(4), height);
      assert.deepEqual([...data.subarray(8)], [8, 2, 0, 0, 0], 'Expected 8-bit noninterlaced RGB');
      break;
    case 'IDAT':
      compressed.push(data);
      break;
    case 'IEND':
      assert.equal(length, 0);
      assert.equal(end + 4, bytes.length, 'Trailing bytes after IEND');
      break;
  }
  kinds.push(kind);
  offset = end + 4;
}
assert.match(kinds.join(' '), /^IHDR(?: IDAT)+ IEND$/);
const scanlines = inflateSync(Buffer.concat(compressed));
const stride = 3 * width + 1;
assert.equal(scanlines.length, stride * height);
for (let y = 0; y < height; y++) assert(scanlines[y * stride] <= 4, `Invalid scanline filter at row ${y}`);
console.log(JSON.stringify({ width, height, bitDepth: 8, colorType: 2, chunks: kinds,
  crcValid: true, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }, null, 2));
