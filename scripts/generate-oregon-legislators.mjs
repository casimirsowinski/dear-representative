/**
 * Compatibility entry point. Prefer `npm run generate:legislators` (national by default).
 * This file re-exports the shared generator and, when invoked directly, generates Oregon only.
 */
export {
  SOURCE_URLS,
  STATE_NAMES,
  toE164,
  mapPersonToLegislator,
  generate as generateNational,
} from './generate-legislators.mjs';

import {generate} from './generate-legislators.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
const thisPath = fileURLToPath(import.meta.url);
if (invokedPath && resolve(invokedPath) === resolve(thisPath)) {
  const argv = process.argv.slice(2);
  const hasState = argv.some(arg => arg.startsWith('--state='));
  const hasAll = argv.includes('--all');
  // Historical default for this filename: Oregon-only unless --all is passed.
  await generate({
    all: hasAll && !hasState,
    state: hasState ? argv.find(arg => arg.startsWith('--state=')).slice('--state='.length).toUpperCase() : (hasAll ? null : 'OR'),
    outPath: argv.find(arg => arg.startsWith('--out='))?.slice('--out='.length),
  });
}
