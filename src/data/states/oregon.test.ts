import {describe, expect, it} from 'vitest';
import {generatedAt, officials, oregonOfficial} from './oregon';
import {officials as allOfficials, sourceUrls} from './current';
import {formatPhone} from '../../lib/contacts';

function expectOfficialUrl(value: string) {
  const url = new URL(value);
  expect(url.protocol).toBe('https:');
  expect(url.username + url.password).toBe('');
  expect(url.hostname).toMatch(/(^|\.)(house|senate)\.gov$/);
}

function expectDate(value: string | null) {
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10)).toBe(value);
  expect(value! <= new Date().toISOString().slice(0, 10)).toBe(true);
}

describe('Oregon contact data (congress-legislators generated)', () => {
  it('documents pinned unitedstates.github.io endpoints in generated notes', () => {
    expect(officials[0]?.notes).toMatch(/unitedstates\.github\.io\/congress-legislators\/legislators-current\.json/);
    expect(sourceUrls.legislatorsCurrent).toBe('https://unitedstates.github.io/congress-legislators/legislators-current.json');
  });

  it('includes two senators and all six House districts keyed by bioguide id', () => {
    expect(officials).toHaveLength(8);
    expect(new Set(officials.map(o => o.id)).size).toBe(8);
    expect(officials.every(o => /^[A-Z]\d{6}$/.test(o.id))).toBe(true);
    expect(officials.filter(o => o.chamber === 'senate')).toHaveLength(2);
    expect(officials.filter(o => o.chamber === 'house').map(o => o.district).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(oregonOfficial('Bonamici').id).toBe('B001278');
    expect(oregonOfficial('W000779').name).toBe('Ron Wyden');
    expectDate(generatedAt);
    for (const official of officials) {
      expect(official.state).toBe('OR');
      expect(official.name).toBeTruthy();
      expect(official.notes).toMatch(/congress-legislators/i);
      expect(official.identityVerification.status).toBe('verified');
      expect(official.identityVerification.sourceUrls.length).toBeGreaterThan(0);
      official.identityVerification.sourceUrls.forEach(expectOfficialUrl);
      expectDate(official.identityVerification.lastVerified);
      expect(official.identityVerification.lastVerified).toBe(generatedAt);
    }
  });

  it('has form, website and D.C. phone records without inventing emails', () => {
    for (const official of officials) {
      expect(new Set(official.contacts.map(c => c.id)).size).toBe(official.contacts.length);
      expect(official.contacts.some(c => c.kind === 'contact-form')).toBe(true);
      expect(official.contacts.some(c => c.kind === 'website')).toBe(true);
      expect(official.contacts.some(c => c.kind === 'phone' && c.office === 'washington-dc')).toBe(true);
      expect(official.contacts.some(c => c.kind === 'email')).toBe(false);
      for (const contact of official.contacts) {
        expect(contact.status).toBe('verified');
        expectDate(contact.lastVerified);
        expect(contact.sourceUrls.length).toBeGreaterThan(0);
        contact.sourceUrls.forEach(expectOfficialUrl);
        if (contact.kind === 'contact-form' || contact.kind === 'website') expectOfficialUrl(contact.url);
        if (contact.kind === 'website') expect(contact.url).toBe(official.websiteUrl);
        if (contact.kind === 'phone') {
          expect(['washington-dc', 'district']).toContain(contact.office);
          expect(contact.number).toMatch(/^\+1\d{10}$/);
          expect(formatPhone(contact.number)).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
          if (contact.office === 'washington-dc') expect(contact.number).toMatch(/^\+1202\d{7}$/);
        }
        if (contact.kind === 'contact-form') {
          expect(contact.functionality.status).toBe('not-tested');
          expectDate(contact.functionality.checkedAt);
          expect(contact.functionality.notes).toMatch(/congress-legislators|generated/i);
        }
      }
    }
  });

  it('records unknown restriction policies instead of pretending hand-verified limits', () => {
    for (const official of officials) {
      expect(official.contactRestrictions.length).toBeGreaterThan(0);
      for (const restriction of official.contactRestrictions) {
        expect(restriction.description).toBeTruthy();
        expect(restriction.appliesTo.length).toBeGreaterThan(0);
        restriction.appliesTo.forEach(id => expect(official.contacts.some(c => c.id === id)).toBe(true));
        expect(restriction.status).toBe('unknown');
        expect(restriction.lastVerified).toBeNull();
        expect(restriction.effect).toBe('unknown');
      }
    }
    expect(officials.flatMap(o => o.contactRestrictions).some(r => r.effect === 'submission-block')).toBe(false);
    expect(officials.flatMap(o => o.contactRestrictions).some(r => r.type === 'address-verification')).toBe(false);
  });

  it('only includes social platforms present in congress-legislators (no invented Bluesky)', () => {
    for (const official of officials) {
      for (const account of official.socialAccounts ?? []) {
        expect(account.accountType).toBe('official-office');
        expect(account.status).toBe('verified');
        expect(account.platform).not.toBe('bluesky');
        expectDate(account.lastVerified);
        account.sourceUrls.forEach(expectOfficialUrl);
      }
    }
  });

  it('is a subset of the national current-member import', () => {
    expect(allOfficials.length).toBeGreaterThanOrEqual(500);
    expect(new Set(allOfficials.map(o => o.id)).size).toBe(allOfficials.length);
    for (const official of officials) {
      expect(allOfficials.some(o => o.id === official.id && o.state === 'OR')).toBe(true);
    }
  });
});
