import {expect, it} from 'vitest';
import {actOnPersonalizedDraft, createPersonalizedDraft, personalizeDraft, replacePersonalizedDraft} from './personalizedDraft';
import type {DraftOrigin} from './draft';
const origin: DraftOrigin = {campaignId:'test', officialId:'B001278', chamber:'house', stateCode:'OR', template:'short'};
const make = (name = '', city = '') => createPersonalizedDraft('Dear Representative Bonamici,\n\nMy words.', origin, {name, city}, 'Oregon');
const body = make().text;

it.each([
  ['', '', ''], ['Alex', '', '\n\nSincerely,\nAlex'], ['', 'Salem', '\n\nSalem, Oregon'],
  ['Alex','Salem','\n\nSincerely,\nAlex\nSalem, Oregon'], ['  ','\t',''],
])('generates optional fields %j / %j without empty placeholders', (name,city,suffix) => {
  const draft = make(name,city);
  expect(draft.text).toBe(body + suffix);
  expect(draft.baseline).toBe(draft.text);
  expect(draft.text).not.toMatch(/\[Your name\]|\[City\]/);
});

it('updates repeatedly and clears each field without duplicate or dangling generated lines', () => {
  let draft = make('Alex','Salem');
  draft = personalizeDraft(draft, {name:'Sam',city:'Portland'}, 'Oregon');
  expect(draft.text).toBe(body + '\n\nSincerely,\nSam\nPortland, Oregon');
  draft = personalizeDraft(draft, {name:'',city:'Portland'}, 'Oregon');
  expect(draft.text).toBe(body + '\n\nPortland, Oregon');
  draft = personalizeDraft(draft, {name:'Lee',city:''}, 'Oregon');
  expect(draft.text).toBe(body + '\n\nSincerely,\nLee');
  draft = personalizeDraft(draft, {name:'',city:''}, 'Oregon');
  expect(draft.text).toBe(body);
});

it('tracks positions through body edits without replacing identical body text', () => {
  let draft = make('Alex','Salem');
  const prefix = 'Sincerely,\nAlex\nSalem, Oregon\n\n';
  draft = actOnPersonalizedDraft(draft, {type:'edit',text:prefix + draft.text});
  draft = personalizeDraft(draft,{name:'Sam',city:'Portland'},'Oregon');
  expect(draft.text).toBe(prefix + body + '\n\nSincerely,\nSam\nPortland, Oregon');
});

it('adds personalization after a complete manual rewrite when none was generated yet', () => {
  let draft = actOnPersonalizedDraft(make(),{type:'edit',text:'Entirely my own words'});
  draft = personalizeDraft(draft,{name:'Alex',city:'Salem'},'Oregon');
  expect(draft.text).toBe('Entirely my own words\n\nSincerely,\nAlex\nSalem, Oregon');
});

it('takes manual name edits out of automatic management but still updates city', () => {
  let draft = make('Alex','Salem');
  draft = actOnPersonalizedDraft(draft,{type:'edit',text:draft.text.replace('Alex','Alexandra')});
  draft = personalizeDraft(draft,{name:'Sam',city:'Portland'},'Oregon');
  expect(draft.text).toBe(body + '\n\nSincerely,\nAlexandra\nPortland, Oregon');
  draft = personalizeDraft(draft,{name:'',city:''},'Oregon');
  expect(draft.text).toBe(body + '\n\nSincerely,\nAlexandra');
});

it('does not recreate manually deleted generated content on any field update', () => {
  let draft = make('Alex','Salem');
  draft = actOnPersonalizedDraft(draft,{type:'edit',text:body});
  draft = personalizeDraft(draft,{name:'Sam',city:'Portland'},'Oregon');
  expect(draft.text).toBe(body);
});

it('restores exact text, baseline, origin and range ownership on Undo without replaying shared input', () => {
  let draft = actOnPersonalizedDraft(make('Alex','Salem'), {type:'edit',text:body + '\n\nYours, Alex\nSalem, Oregon'});
  const before = draft;
  draft = replacePersonalizedDraft(draft,createPersonalizedDraft('New template', {...origin,template:'short'}, {name:'Alex',city:'Salem'},'Oregon'));
  draft = personalizeDraft(draft,{name:'Sam',city:'Portland'},'Oregon');
  draft = actOnPersonalizedDraft(draft,{type:'undo'});
  expect(draft.text).toBe(before.text);
  expect(draft.baseline).toBe(before.baseline);
  expect(draft.origin).toEqual(before.origin);
  expect(draft.personalization).toEqual(before.personalization);
  expect(personalizeDraft(draft,{name:'Sam',city:'Portland'},'Oregon')).toBe(draft);
});
