import { describe, expect, it } from 'vitest';
import { congressionalLeadership as campaign } from '../campaigns/congressional-leadership';
import { legislators, states } from '../data/states';
import { campaigns } from '../campaigns';
import { renderBody, renderCompleteMessage, renderSubject, renderTemplate } from './messages';
import baseline from './__fixtures__/approved-messages.json';
import type { Sender } from '../types';
const state = states[0];
const house = legislators.find(o => o.id === 'B001278')!; // Bonamici
const senate = legislators.find(o => o.id === 'W000779')!; // Wyden
describe('message rendering', () => {
    for (const official of [house, senate]) {
        for (const kind of ['short', 'detailed'] as const) {
            it(`preserves the approved ${official.chamber} ${kind} wording exactly`, () => {
                expect(renderBody(campaign, official, state, kind)).toBe(baseline[official.chamber][kind].body);
                expect(renderSubject(campaign, official, state, kind)).toBe(baseline[official.chamber][kind].subject);
            });
        }
    }
    it.each<[
        Sender,
        string,
        string
    ]>([
        [{}, '[Your name]', '[City]'],
        [{ name: '  ', city: '\t' }, '[Your name]', '[City]'],
        [{ name: ' Alex ' }, 'Alex', '[City]'],
        [{ city: ' Salem ' }, '[Your name]', 'Salem'],
        [{ name: ' Alex ', city: ' Salem ' }, 'Alex', 'Salem'],
    ])('handles optional sender fields: %j', (sender, name, city) => {
        expect(renderCompleteMessage(campaign, house, state, 'Edited body', sender)).toBe(`Subject: Oppose Hakeem Jeffries as House Democratic Leader\n\nEdited body\n\nSincerely,\n${name}\n${city}, Oregon`);
    });
    it('substitutes explicit salutations without changing approved body wording', () => {
        const body = renderBody(campaign, {...house, salutation:'Representative Example-Smith'}, state, 'short');
        expect(body).toBe(baseline.house.short.body.replace('Representative Bonamici','Representative Example-Smith'));
        expect(body.match(/Dear /g)).toHaveLength(1);
        expect(body).not.toMatch(/Sincerely,|\[Your Name\]|\[Last Name\]|Subject:/);
    });
    it('has exactly four active templates and two length labels', () => {
        expect(Object.keys(campaign.templates.house)).toEqual(['short','detailed']);
        expect(Object.keys(campaign.templates.senate)).toEqual(['short','detailed']);
        expect(Object.values(campaign.templates).flatMap(Object.values)).toHaveLength(4);
    });
    it('does not interpret user text as placeholders or markup', () => {
        const message = renderCompleteMessage(campaign, house, state, '{{leader}} <b>my words</b>', { name: '{{officialName}} $&' });
        expect(message).toContain('{{leader}} <b>my words</b>');
        expect(message).toContain('Sincerely,\n{{officialName}} $&');
    });
    it('reports unknown placeholders instead of silently dropping text', () => {
        expect(() => renderTemplate('{{typo}}', { officialName: '', salutation: '', stateName: '', senderName: '', senderCity: '', details: {} })).toThrow('Unknown message placeholder: typo');
    });
});
describe('data consistency', () => {
    it('has unique identifiers and valid national contacts without invented verification', () => {
        expect(states[0]?.code).toBe('OR');
        expect(states.map(s => s.code)).toContain('OR');
        expect(states.length).toBeGreaterThan(50);
        expect(new Set(legislators.map(o => o.id)).size).toBe(legislators.length);
        expect(legislators.length).toBeGreaterThanOrEqual(500);
        expect(legislators.filter(o => o.state === 'OR')).toHaveLength(8);
        for (const official of legislators) {
            expect(states.some(s => s.code === official.state)).toBe(true);
            expect(official.salutation).toBeTruthy();
            if (official.chamber === 'house')
                expect(official.district).toBeGreaterThanOrEqual(0);
            else
                expect(official.district).toBeUndefined();
        }
    });
    it('provides every template and unique petition IDs for each campaign', () => {
        expect(new Set(campaigns.map(c => c.id)).size).toBe(campaigns.length);
        for (const entry of campaigns) {
            for (const official of [house, senate])
                for (const kind of ['short', 'detailed'] as const) {
                    expect(entry.templates[official.chamber][kind]).toMatchObject({ id: kind, chamber: official.chamber });
                    expect(renderBody(entry, official, state, kind)).not.toMatch(/\{\{\w+\}\}/);
                }
            expect(new Set(entry.petitions.map(p => p.id)).size).toBe(entry.petitions.length);
        }
    });
});
