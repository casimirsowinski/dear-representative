import type {Legislator, State} from '../../types';
import {
  officials as generatedOfficials,
  generatedAt,
  generatedStateCodes,
  sourceUrls,
} from './current.generated';

/** Postal codes → display names for all jurisdictions present in congress-legislators. */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
  AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands',
};

/**
 * Current U.S. congressional members imported from unitedstates/congress-legislators.
 * Refresh with `npm run generate:legislators`. No browser network fetch.
 */
export const officials: Legislator[] = generatedOfficials;

if (officials.length === 0) {
  throw new Error('Current officials list is empty. Run `npm run generate:legislators` and fix import errors before building.');
}

export {generatedAt, generatedStateCodes, sourceUrls};

export const states: State[] = generatedStateCodes.map(code => ({
  code,
  name: STATE_NAMES[code] ?? code,
}));

export function stateFor(code: string): State {
  const name = STATE_NAMES[code];
  if (!name) throw new Error(`Unknown state code ${JSON.stringify(code)}`);
  return {code, name};
}

export function officialsForState(code: string): Legislator[] {
  return officials.filter(o => o.state === code);
}

/** Look up a generated official by bioguide id or case-insensitive name substring. */
export function findOfficial(idOrName: string): Legislator {
  const needle = idOrName.trim().toLowerCase();
  const found = officials.find(o =>
    o.id.toLowerCase() === needle
    || o.name.toLowerCase() === needle
    || o.name.toLowerCase().includes(needle)
    || o.salutation.toLowerCase().includes(needle));
  if (!found) throw new Error(`No official matching ${JSON.stringify(idOrName)}`);
  return found;
}

export function formatOfficialOption(official: Legislator): string {
  return official.chamber === 'senate'
    ? `${official.name} — Senate (${official.state})`
    : `${official.name} — House ${official.state}-${official.district}`;
}
