// Copies the web app (../app.html) into the phone app, so both always run the same scenes and code.
// Run with: npm run sync-web
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const body = readFileSync(join(here, '..', '..', 'app.html'), 'utf8');
const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1">' +
  '</head><body>\n' + body + '\n</body></html>\n';
const out = join(here, '..', 'src', 'web', 'appHtml.ts');
writeFileSync(out, '// Generated from ../app.html by scripts/sync-web.mjs. Do not edit by hand.\nexport default ' + JSON.stringify(html) + ';\n');
console.log('Wrote ' + out + ' (' + Math.round(html.length / 1024) + ' KB)');
