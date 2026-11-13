import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import App from './App';
import {oregonOfficial} from './data/states/oregon';

afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
const change = (element: HTMLElement, value: string) => fireEvent.change(element, {target: {value}});
const wyden = oregonOfficial('Wyden');
const bonamici = oregonOfficial('Bonamici');

describe('composer', () => {
  it('discloses local composition, clipboard use and hosting privacy without hiding the notice', () => {
    render(<App/>);
    expect(screen.getByText('Find official congressional contact channels for current members, write your own message, and explore public petitions. Your message stays in your browser. Nothing is submitted automatically.')).toBeTruthy();
    expect(screen.getByText(/U\.S\. CONGRESS · CIVIC CONTACT/)).toBeTruthy();
    const disclosure = screen.getByRole('region', {name:'Your privacy'});
    expect(disclosure.closest('details')).toBeNull();
    expect(disclosure.textContent).toContain('browser memory');
    expect(disclosure.textContent).toContain('device clipboard');
    expect(disclosure.textContent).toContain('External congressional and petition websites');
    expect(disclosure.textContent).toContain('technical request information and access logs');
    expect(within(disclosure).getByRole('link', {name:'GitHub’s privacy statement'}).getAttribute('href')).toBe('https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement');
    for (const name of ['Email, Form & Phone','Social','Petitions','Directory','Sources & Context']) {
      expect(screen.getByRole('region', {name}).parentElement?.tagName).toBe('MAIN');
    }
  });
  it('orders five full-width sections with matching navigation targets and a permanent Social section', () => {
    render(<App/>);
    const sections = Array.from(document.querySelectorAll('main > section'));
    expect(sections.map(s => s.id)).toEqual(['contact','social','petitions','directory','sources']);
    expect(sections.map(s => s.querySelector('h2')?.textContent?.trim())).toEqual(['Email, Form & Phone','Social','Petitions','Directory','Sources & Context']);
    const navigation = screen.getByRole('navigation', {name:'Page sections'});
    expect(within(navigation).getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['#contact','#social','#petitions','#directory','#sources']);
    const social = screen.getByRole('region', {name:'Social'});
    expect(social.querySelector('details, summary')).toBeNull();
    change(screen.getByLabelText('Your social draft'), 'Retain my draft');
    change(screen.getByLabelText('Congressional office'), wyden.id);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your social draft').value).toBe('Retain my draft');
  });

  it('keeps selected identity visible and shares the same phone actions with the directory', () => {
    render(<App/>);
    const composer = screen.getByRole('region', {name:'Email, Form & Phone'});
    const directory = screen.getByRole('region', {name:'Directory'});
    expect(within(composer).getByRole('heading', {name:'Suzanne Bonamici'})).toBeTruthy();
    for (const section of [composer, directory]) {
      const contact = within(section).getByRole('group', {name:'Contact Suzanne Bonamici'});
      expect(within(contact).getByRole('link', {name:/225-0855.*Call Suzanne/}).getAttribute('href')).toBe('tel:+12022250855');
      expect(within(contact).getByRole('button', {name:/Copy Suzanne/}).textContent).toBe('Copy');
    }
    change(screen.getByLabelText('Congressional office'), wyden.id);
    const selectedContact = within(composer).getByRole('group', {name:'Contact Ron Wyden'});
    expect(within(selectedContact).getByRole('heading', {name:'Ron Wyden'})).toBeTruthy();
    expect(within(selectedContact).getByText('U.S. Senator')).toBeTruthy();
    expect(within(composer).queryByRole('heading', {name:'Suzanne Bonamici'})).toBeNull();
  });
  it('preserves petition filtering and external contact links', () => {
    render(<App/>);
    const form = bonamici.contacts.find(c => c.kind === 'contact-form')!;
    expect(screen.getByRole('link', {name: 'Open official form for Suzanne Bonamici'}).getAttribute('href')).toBe(form.kind === 'contact-form' ? form.url : '');
    change(screen.getByLabelText('Filter'), 'house');
    expect(screen.queryByRole('heading', {name: 'Remove Chuck Schumer for a younger leader'})).toBeNull();
    expect(screen.getByRole('heading', {name: 'Remove Chuck Schumer and Hakeem Jeffries from leadership roles'})).toBeTruthy();
  });

});
