import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import App from '../App';
import SocialComposer from './SocialComposer';
import {officials, oregon, oregonOfficial} from '../data/states/oregon';
import {congressionalLeadership as campaign} from '../campaigns/congressional-leadership';
import {renderBody} from '../lib/messages';
import blueskyArtwork from '../assets/social/dear-representative-social-icons/bluesky.svg?raw';
import twitterArtwork from '../assets/social/dear-representative-social-icons/twitter.svg?raw';

afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); Reflect.deleteProperty(document, 'execCommand');});
const editor = () => screen.getByLabelText<HTMLTextAreaElement>('Your social draft');
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), {target:{value}});
const bonamici = oregonOfficial('Bonamici');
const wyden = oregonOfficial('Wyden');
const bonamiciX = bonamici.socialAccounts!.find(a => a.platform === 'x')!;

it('shows original decorative artwork in the permanent Social section heading', () => {
  render(<App/>);
  const section = screen.getByRole('region', {name:'Social'});
  const heading = within(section).getByRole('heading', {name:'Social', level:2});
  expect(section.querySelector('details, summary, [aria-expanded]')).toBeNull();
  expect(heading.querySelector('a, button, [tabindex]')).toBeNull();
  expect(within(section).getByLabelText('Your social draft')).toBeTruthy();
  const icons = heading.querySelectorAll('svg');
  expect(icons).toHaveLength(2);
  for (const [i, artwork] of [blueskyArtwork, twitterArtwork].entries()) {
    const original = new DOMParser().parseFromString(artwork, 'image/svg+xml').documentElement;
    expect(icons[i].getAttribute('viewBox')).toBe(original.getAttribute('viewBox'));
    expect(icons[i].querySelector('path')?.getAttribute('d')).toBe(original.querySelector('path')?.getAttribute('d'));
    expect(icons[i].querySelector('path')?.getAttribute('fill')).toBe('currentColor');
    expect(icons[i].getAttribute('aria-hidden')).toBe('true');
    expect(icons[i].closest('.social-heading-icons')?.getAttribute('aria-hidden')).toBe('true');
  }
});

it('uses Twitter labels while preserving the internal identifier and profile destination', () => {
  render(<App/>);
  expect(screen.getByRole('option', {name:'Twitter'}).getAttribute('value')).toBe('x');
  change('Social platform', 'x');
  expect(screen.getByText(/Twitter has a standard limit of 280 weighted characters/)).toBeTruthy();
  expect(screen.getByRole('link', {name:/Open Twitter/}).getAttribute('href')).toBe('https://x.com/');
  expect(screen.getAllByRole('link', {name:/Twitter: @RepBentz/})[0].getAttribute('href')).toBe('https://x.com/RepBentz');
  expect(screen.queryByRole('option', {name:'X'})).toBeNull();
});

it('starts empty and retains social text independently through official, template and platform changes', () => {
  render(<App/>);
  expect(editor().value).toBe('');
  change('Your social draft', 'Keep my @recipient and words');
  change('Your name (optional)', 'Private Name');
  change('City (optional)', 'Private City');
  change('Message for Suzanne Bonamici', 'Letter only');
  change('Congressional office', wyden.id);
  change('Message length', 'detailed');
  change('Social platform', 'x');
  expect(editor().value).toBe('Keep my @recipient and words');
  expect(screen.getByText(/Selected office: Ron Wyden/).textContent).toContain('Review recipient references');
  expect(screen.getByText(/280 weighted/)).toBeTruthy();
  expect(editor().getAttribute('aria-describedby')).toContain('social-limit');
});

it('imports only rendered House/Senate bodies and offers Undo without confirmation', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<App/>);
  change('Your name (optional)', 'Private Name');
  change('City (optional)', 'Private City');
  change('Message for Suzanne Bonamici', 'Letter only');
  fireEvent.click(screen.getByRole('button', {name:'Use existing short template'}));
  expect(confirm).not.toHaveBeenCalled();
  expect(editor().value).toBe(renderBody(campaign, bonamici, oregon, 'short'));
  change('Your social draft', 'Keep me');
  change('Congressional office', wyden.id);
  fireEvent.click(screen.getByRole('button', {name:'Use existing short template'}));
  expect(editor().value).toBe(renderBody(campaign, officials[0], oregon, 'short'));
  fireEvent.click(screen.getByRole('button', {name:'Undo social draft replacement'}));
  expect(editor().value).toBe('Keep me');
  expect(document.activeElement).toBe(editor());
  fireEvent.click(screen.getByRole('button', {name:'Use existing short template'}));
  expect(editor().value).toBe(renderBody(campaign, officials[0], oregon, 'short'));
  expect(editor().value).not.toContain('Private');
  const letter = screen.getByLabelText<HTMLTextAreaElement>('Message for Ron Wyden').value;
  fireEvent.click(screen.getByRole('button', {name:'Reset social draft'}));
  expect(editor().value).toBe('');
  fireEvent.click(screen.getByRole('button', {name:'Undo social draft replacement'}));
  expect(editor().value).toBe(renderBody(campaign, officials[0], oregon, 'short'));
  fireEvent.click(screen.getByRole('button', {name:'Reset social draft'}));
  expect(editor().value).toBe('');
  expect(screen.getByLabelText<HTMLTextAreaElement>('Message for Ron Wyden').value).toBe(letter);
  expect(screen.getByLabelText<HTMLInputElement>('Your name (optional)').value).toBe('Private Name');
  expect(screen.getByLabelText<HTMLInputElement>('City (optional)').value).toBe('Private City');
  expect(confirm).not.toHaveBeenCalled();
});

it('works without an account, never truncates, and copies exactly without putting drafts into links', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', {clipboard:{writeText}});
  render(<SocialComposer campaign={campaign} official={{...officials[0], socialAccounts:[]}} state={oregon}/>);
  const text = '👨‍👩‍👧‍👦'.repeat(301) + '?private=secret&name=Alex';
  change('Your social draft', text);
  expect(screen.getByText(/over the Bluesky limit/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name:'Copy social draft'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Social draft copied.'));
  expect(writeText).toHaveBeenCalledWith(text);
  expect(editor().value).toBe(text);
  expect(screen.getByRole('link', {name:/Open Bluesky/}).getAttribute('href')).toBe('https://bsky.app/');
  change('Social platform', 'x');
  const link = screen.getByRole('link', {name:/Open Twitter/});
  expect(link.getAttribute('href')).toBe('https://x.com/');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
});

it('restores textarea focus and selection and removes temporary controls when fallback copying fails', async () => {
  vi.stubGlobal('navigator', {});
  Object.defineProperty(document, 'execCommand', {configurable:true, value:vi.fn(() => {throw new Error('denied');})});
  render(<SocialComposer campaign={campaign} official={officials[0]} state={oregon}/>);
  change('Your social draft', 'copy my words');
  editor().focus(); editor().setSelectionRange(2, 6, 'backward');
  fireEvent.click(screen.getByRole('button', {name:'Copy social draft'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Copy unavailable'));
  expect(document.activeElement).toBe(editor());
  expect([editor().selectionStart, editor().selectionEnd, editor().selectionDirection]).toEqual([2,6,'backward']);
  expect(document.querySelectorAll('textarea').length).toBe(1);
});

it('keeps social verification sources accessible in the existing details', () => {
  render(<App/>);
  const region = screen.getByRole('region', {name:'Email, Form & Phone'});
  const contact = within(region).getByRole('group', {name:'Contact Suzanne Bonamici'});
  fireEvent.click(within(contact).getByText('Sources and contact details'));
  const profile = within(contact).getByRole('link', {name: new RegExp(`Twitter: @${bonamiciX.handle}`)});
  expect(profile.closest('details')?.open).toBe(true);
  const source = within(contact).getByText(new RegExp(`Official-office social profile @${bonamiciX.handle}`));
  expect(source.closest('details')).not.toBeNull();
  expect(source.textContent).toContain(bonamiciX.lastVerified);
  expect(within(source).getByRole('link', {name:'Source 1'}).getAttribute('href')).toBe(bonamici.websiteUrl);
});

it('labels unavailable exact counting and keeps the draft usable', () => {
  vi.spyOn(Intl, 'Segmenter', 'get').mockReturnValue(undefined as never);
  render(<SocialComposer campaign={campaign} official={officials[0]} state={oregon}/>);
  change('Your social draft', '👨‍👩‍👧‍👦');
  expect(screen.getByText(/Exact counting is unavailable/)).toBeTruthy();
  expect(editor().value).toBe('👨‍👩‍👧‍👦');
  expect(screen.getByRole<HTMLButtonElement>('button', {name:'Copy social draft'}).disabled).toBe(false);
});

it('does not report an old clipboard operation as copying an edited draft', async () => {
  let finish!: () => void;
  vi.stubGlobal('navigator', {clipboard:{writeText: () => new Promise<void>(resolve => {finish = resolve;})}});
  render(<SocialComposer campaign={campaign} official={officials[0]} state={oregon}/>);
  change('Your social draft', 'Old text');
  fireEvent.click(screen.getByRole('button', {name:'Copy social draft'}));
  change('Your social draft', 'New text');
  finish();
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe(''));
  expect(editor().value).toBe('New text');
});
