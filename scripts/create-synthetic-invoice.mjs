import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const output = resolve(
  process.argv[2] ?? '/tmp/homeapp-synthetic-alza-layout-invoice.pdf',
);
const lines = [
  'Alza.cz a.s. www.alza.cz',
  'Supplier: Alza.cz',
  'Customer: Synthetic Household s.r.o.',
  'Invoice number: FV-SYN-2026-77',
  'Variable symbol: 2026077001',
  'Issue date: 14. 7. 2026',
  'Due date: 28. 7. 2026',
  'Notebook Lenovo ThinkPad | 1 | ks | 38 990,00 CZK | 38 990,00 CZK',
  'Total due: 38 990,00 CZK',
];
const content = lines
  .map(
    (line, index) =>
      `BT /F1 12 Tf 72 ${String(740 - index * 24)} Td (${line.replaceAll('(', '\\(').replaceAll(')', '\\)')}) Tj ET`,
  )
  .join('\n');
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${String(Buffer.byteLength(content))} >>\nstream\n${content}\nendstream`,
];
let body = '%PDF-1.4\n';
const offsets = [0];
for (const [index, object] of objects.entries()) {
  offsets.push(Buffer.byteLength(body));
  body += `${String(index + 1)} 0 obj\n${object}\nendobj\n`;
}
const xref = Buffer.byteLength(body);
body += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
body += offsets
  .slice(1)
  .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
  .join('');
body += `trailer\n<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xref)}\n%%EOF`;
await writeFile(output, body, { flag: 'wx', mode: 0o600 });
process.stdout.write(`${output}\n`);
