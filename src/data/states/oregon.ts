import type {Legislator, State} from '../../types';
import {findOfficial, generatedAt, officials as allOfficials, officialsForState} from './current';

export const oregon: State = {code: 'OR', name: 'Oregon'};

/**
 * Oregon congressional delegation filtered from the national congress-legislators import.
 * Refresh with `npm run generate:legislators`.
 */
export const officials: Legislator[] = officialsForState('OR');

if (officials.length === 0) {
  throw new Error('Oregon officials list is empty. Run `npm run generate:legislators` and fix import errors before building.');
}

export {generatedAt};

/** Look up a generated Oregon official by bioguide id or case-insensitive name substring. */
export function oregonOfficial(idOrName: string): Legislator {
  const found = findOfficial(idOrName);
  if (found.state !== 'OR') throw new Error(`No Oregon official matching ${JSON.stringify(idOrName)}`);
  // Prefer the Oregon slice entry when present (same object references from filter).
  return officials.find(o => o.id === found.id) ?? found;
}

export {allOfficials};
