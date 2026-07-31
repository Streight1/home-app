import { expeditionsInvalid } from '../domain/expeditions.errors.js';

export type SafeImageMime = 'image/jpeg' | 'image/png';

function sanitizeJpeg(input: Buffer): Buffer {
  if (input[0] !== 0xff || input[1] !== 0xd8)
    throw expeditionsInvalid('Obsah obrázku neodpovídá JPEG.');
  const output: Buffer[] = [input.subarray(0, 2)];
  let offset = 2;
  while (offset < input.length) {
    if (input[offset] !== 0xff)
      throw expeditionsInvalid('Struktura JPEG obrázku není platná.');
    const marker = input[offset + 1];
    if (marker === undefined)
      throw expeditionsInvalid('Struktura JPEG obrázku není platná.');
    if (marker === 0xda) {
      output.push(input.subarray(offset));
      return Buffer.concat(output);
    }
    if (marker === 0xd9) {
      output.push(input.subarray(offset, offset + 2));
      return Buffer.concat(output);
    }
    const length = input.readUInt16BE(offset + 2);
    const end = offset + 2 + length;
    if (length < 2 || end > input.length)
      throw expeditionsInvalid('Struktura JPEG obrázku není platná.');
    const isMetadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) output.push(input.subarray(offset, end));
    offset = end;
  }
  throw expeditionsInvalid('JPEG obrázek není dokončený.');
}

function sanitizePng(input: Buffer): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!input.subarray(0, 8).equals(signature))
    throw expeditionsInvalid('Obsah obrázku neodpovídá PNG.');
  const output = [input.subarray(0, 8)];
  let offset = 8;
  let ended = false;
  while (offset + 12 <= input.length) {
    const length = input.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > input.length)
      throw expeditionsInvalid('Struktura PNG obrázku není platná.');
    const type = input.toString('ascii', offset + 4, offset + 8);
    const critical = /^[A-Z]/.test(type);
    if (critical || type === 'tRNS') output.push(input.subarray(offset, end));
    offset = end;
    if (type === 'IEND') {
      ended = true;
      break;
    }
  }
  if (!ended) throw expeditionsInvalid('PNG obrázek není dokončený.');
  return Buffer.concat(output);
}

export function sanitizeImage(
  input: Buffer,
  mimeType: string | null,
): { buffer: Buffer; mimeType: SafeImageMime; extension: 'jpg' | 'png' } {
  if (mimeType === 'image/jpeg')
    return {
      buffer: sanitizeJpeg(input),
      mimeType: 'image/jpeg',
      extension: 'jpg',
    };
  if (mimeType === 'image/png')
    return {
      buffer: sanitizePng(input),
      mimeType: 'image/png',
      extension: 'png',
    };
  throw expeditionsInvalid(
    'Podporované jsou pouze bezpečné PNG a JPEG obrázky.',
  );
}
