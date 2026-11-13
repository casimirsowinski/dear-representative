import type {Legislator} from '../types';
import {formatOfficialOption} from '../data/states/current';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,.'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHonorifics(value: string): string {
  return normalize(value)
    .replace(/^(rep\.?|representative|senator|sen\.?|congress(?:wo)?man|the honorable)\s+/i, '')
    .trim();
}

/** Rank a legislator for type-ahead; higher is better. 0 means no match. */
export function scoreOfficialMatch(query: string, official: Legislator): number {
  const q = stripHonorifics(query);
  if (!q) return 0;
  const name = normalize(official.name);
  const label = normalize(formatOfficialOption(official));
  const state = normalize(official.state);
  const haystacks = [name, label, `${name} ${state}`, official.id.toLowerCase()];

  let best = 0;
  for (const hay of haystacks) {
    if (!hay) continue;
    if (hay === q) return 100;
    if (hay.startsWith(q)) best = Math.max(best, 90);
    if (hay.includes(q) || q.includes(hay)) best = Math.max(best, 80);
  }

  const qParts = q.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const nParts = name.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (qParts.length && nParts.length) {
    const lastQ = qParts[qParts.length - 1];
    const lastN = nParts[nParts.length - 1];
    if (lastQ === lastN || lastN.startsWith(lastQ)) {
      const firstHit = qParts.some(part => part !== lastQ && nParts.some(n => n === part || n.startsWith(part)));
      best = Math.max(best, firstHit ? 70 : 45);
    } else if (nParts.some(n => n.startsWith(qParts[0]))) {
      best = Math.max(best, 35);
    }
  }

  if (state === q || official.state.toLowerCase() === q) best = Math.max(best, 30);
  return best;
}

export function suggestOfficials(
  officials: Legislator[],
  query: string,
  {limit = 8, minScore = 35}: {limit?: number; minScore?: number} = {},
): Legislator[] {
  const scored = officials
    .map(official => ({official, score: scoreOfficialMatch(query, official)}))
    .filter(row => row.score >= minScore)
    .sort((a, b) => b.score - a.score || a.official.name.localeCompare(b.official.name));
  return scored.slice(0, limit).map(row => row.official);
}
