import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import App from '../App';
import MultiOfficeContact from './MultiOfficeContact';
import {congressionalLeadership as campaign} from '../campaigns/congressional-leadership';
import {officials, oregon, oregonOfficial} from '../data/states/oregon';

afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); Reflect.deleteProperty(document, 'execCommand');});
const bonamici = oregonOfficial('Bonamici');
const wyden = oregonOfficial('Wyden');
const merkley = oregonOfficial('Merkley');
const bentz = oregonOfficial('Bentz');
const setup = () => render(<MultiOfficeContact officialId={bonamici.id} officials={officials} state={oregon} campaign={campaign} kind="short" sender={{}}/>);
const list = () => screen.getByRole('list', {name:'Selected offices'});
const completed = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', {name:`Completed by me: ${name}`});
const options = () => fireEvent.click(screen.getByText('Choose additional offices or deselect recipients'));
const all = () => {options(); fireEvent.click(screen.getByRole('button', {name:'Select all Oregon offices'}));};

it('has three unique default cards and a single representative selector', () => {
 render(<App/>);
 expect(within(list()).getAllByRole('listitem')).toHaveLength(3);
 expect(within(list()).getAllByRole('heading').map(h=>h.textContent)).toEqual(['Suzanne Bonamici','Ron Wyden','Jeff Merkley']);
 const section=screen.getByRole('region',{name:'Email, Form & Phone'});
 expect(within(section).getAllByRole('group', {name:/^Contact (Suzanne|Ron|Jeff)/})).toHaveLength(3);
 expect(within(section).getAllByRole('combobox')).toHaveLength(2);
 expect(screen.queryByText('Selected representative')).toBeNull();
 expect(screen.getByRole('button',{name:'Open all 3 forms'})).toBeTruthy();
});

it.each([
  [oregonOfficial('Bentz'),'Cliff Bentz'],
  [oregonOfficial('Dexter'),'Maxine Dexter'],
  [oregonOfficial('Hoyle'), oregonOfficial('Hoyle').name],
  [oregonOfficial('Bynum'), oregonOfficial('Bynum').name],
  [oregonOfficial('Salinas'),'Andrea Salinas'],
])('follows the composer selection %s without replacing the draft', (official, name) => {
 render(<App/>);
 const editor=screen.getByLabelText<HTMLTextAreaElement>('Message for Suzanne Bonamici');
 fireEvent.change(editor,{target:{value:'Keep my edits'}});
 fireEvent.change(screen.getByLabelText('Congressional office'),{target:{value:official.id}});
 expect(within(list()).getAllByRole('heading').map(h=>h.textContent)).toEqual([name,'Ron Wyden','Jeff Merkley']);
 expect(editor.value).toBe('Keep my edits');

 fireEvent.change(screen.getByLabelText('Congressional office'),{target:{value:wyden.id}});
 expect(within(list()).getAllByRole('listitem')).toHaveLength(2);
});

it('adds offices without duplicates and retains manual progress through changes', () => {
 render(<App/>);fireEvent.click(completed('Suzanne Bonamici'));fireEvent.click(completed('Ron Wyden'));
 fireEvent.change(screen.getByLabelText('Congressional office'),{target:{value:bentz.id}});
 expect(completed('Ron Wyden').checked).toBe(true); expect(completed('Cliff Bentz').checked).toBe(false);
 all(); expect(within(list()).getAllByRole('listitem')).toHaveLength(8);expect(completed('Suzanne Bonamici').checked).toBe(true);
 fireEvent.change(screen.getByLabelText('Congressional office'),{target:{value:bonamici.id}});
 expect(within(list()).getAllByRole('listitem')).toHaveLength(8);
 for(const input of within(screen.getByRole('group',{name:'Offices to contact'})).getAllByRole('checkbox')) fireEvent.click(input);
 expect(within(list()).queryAllByRole('listitem')).toHaveLength(0);
 expect(screen.getByRole<HTMLButtonElement>('button',{name:'Open all 0 forms'}).disabled).toBe(true);
});

it('keeps verified links and restrictions in details, and never infers completion or persists progress', () => {
 const open=vi.spyOn(window,'open').mockReturnValue(null); const persist=vi.spyOn(Storage.prototype,'setItem');const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
 setup();all();
 for(const o of officials){
  const form=o.contacts.find(c=>c.kind==='contact-form')!;
  const link=within(list()).getByRole('link',{name:`Open official form for ${o.name}`});
  expect(link.getAttribute('href')).toBe(form.kind==='contact-form'?form.url:'');expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  fireEvent.click(link);expect(completed(o.name).checked).toBe(false);
  const card=link.closest('li')!;const details=card.querySelector<HTMLDetailsElement>('.contact-details')!;
  expect(details.open).toBe(false);
  for(const r of o.contactRestrictions)expect(details.textContent).toContain(r.description);
  expect(card.querySelector('.contact-notice')).toBeNull();
  const phone=o.contacts.find(c=>c.kind==='phone'&&c.office==='washington-dc')!;
  expect(within(card).getByRole('link',{name:/Call .*Washington/}).getAttribute('href')).toBe(phone.kind==='phone'?`tel:${phone.number}`:'');
 }
 expect(open).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();expect(persist).not.toHaveBeenCalled();
 fireEvent.click(completed('Ron Wyden'));cleanup();setup();expect(completed('Ron Wyden').checked).toBe(false);
});

it('attempts only verified selected forms synchronously and reports partial or blocked openings without retrying', () => {
 const open=vi.spyOn(window,'open').mockReturnValueOnce({} as Window).mockReturnValueOnce(null).mockImplementationOnce(()=>{throw new Error('blocked');});
 setup();expect(open).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Open all 3 forms'}));
 expect(open).toHaveBeenCalledTimes(3);
 const ids=[bonamici.id, wyden.id, merkley.id];
 ids.forEach((id,i)=>{const form=officials.find(o=>o.id===id)!.contacts.find(c=>c.kind==='contact-form')!;expect(open).toHaveBeenNthCalledWith(i+1,form.kind==='contact-form'?form.url:'','_blank','noopener,noreferrer');});
 expect(screen.getByText(/2 tab openings could not be confirmed/)).toBeTruthy();
 expect(within(list()).getAllByRole('link',{name:/Open official form/})).toHaveLength(3);
 for(const name of ['Suzanne Bonamici','Ron Wyden','Jeff Merkley'])expect(completed(name).checked).toBe(false);
});

it('excludes unverified forms from bulk opening', () => {
 const open=vi.spyOn(window,'open').mockReturnValue(null);
 render(<MultiOfficeContact officialId={wyden.id} officials={[{...officials[0],contacts:officials[0].contacts.map(c=>({...c,status:'unknown',lastVerified:null}))}]} state={oregon} campaign={campaign} kind="short" sender={{}}/>);
 expect(screen.getByRole<HTMLButtonElement>('button',{name:'Open all 0 forms'}).disabled).toBe(true);
 expect(within(list()).queryByRole('link',{name:/Open official form/})).toBeNull();expect(open).not.toHaveBeenCalled();
});

it('offers overflow controls and keyboard scrolling without intercepting card controls', () => {
 setup();const track=list();
 Object.defineProperties(track,{clientWidth:{value:240},scrollWidth:{value:900}});
 const scrollBy=vi.fn(),scrollTo=vi.fn();track.scrollBy=scrollBy;track.scrollTo=scrollTo;
 fireEvent(window,new Event('resize'));
 expect(screen.getByRole<HTMLButtonElement>('button',{name:/Previous offices/}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:/Next offices/}));expect(scrollBy).toHaveBeenCalled();
 track.focus();expect(document.activeElement).toBe(track);fireEvent.keyDown(track,{key:'ArrowRight'});fireEvent.keyDown(track,{key:'End'});
 expect(scrollTo).toHaveBeenCalledWith({left:900,behavior:'auto'});
 scrollBy.mockClear();fireEvent.keyDown(completed('Ron Wyden'),{key:'ArrowRight'});expect(scrollBy).not.toHaveBeenCalled();
});
