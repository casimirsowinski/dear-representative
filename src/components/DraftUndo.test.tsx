import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, within, waitFor} from '@testing-library/react';
import App from '../App';
import {renderBody} from '../lib/messages';
import {officials, oregon, oregonOfficial} from '../data/states/oregon';
import {congressionalLeadership as campaign} from '../campaigns/congressional-leadership';

afterEach(() => {cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();Reflect.deleteProperty(document,'execCommand');});
const card=(name:string)=>within(within(screen.getByRole('list',{name:'Selected offices'})).getByRole('group',{name:`Contact ${name}`}));
const editor=(name:string)=>screen.getByLabelText<HTMLTextAreaElement>(`Message for ${name}`);
const change=(label:string,value:string)=>fireEvent.change(screen.getByLabelText(label),{target:{value}});
const bon='Suzanne Bonamici', ron='Ron Wyden', jeff='Jeff Merkley';
const bonamici=oregonOfficial('Bonamici'), bentz=oregonOfficial('Bentz'), dexter=oregonOfficial('Dexter');
const reset=(name:string)=>fireEvent.click(card(name).getByRole('button',{name:'Reset to selected template'}));
const undo=(name:string)=>fireEvent.click(card(name).getByRole('button',{name:'Undo letter draft replacement'}));

it('renders only recipient editors with correctly addressed chamber templates and shared sender fields',()=>{
 render(<App/>);
 const section=screen.getByRole('region',{name:'Email, Form & Phone'});
 expect(section.querySelectorAll('textarea')).toHaveLength(3);
 expect(screen.queryByLabelText('Your message')).toBeNull();
 expect(screen.getAllByLabelText('Your name (optional)')).toHaveLength(1);
 for(const name of [bon,ron,jeff])expect(editor(name).value).toBe(renderBody(campaign,officials.find(o=>o.name===name)!,oregon,'short'));
 expect(section.querySelectorAll('input:not([type=checkbox])')).toHaveLength(3); // office search + name + city
 expect(screen.getByLabelText('Your name (optional)').compareDocumentPosition(editor(bon)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('preserves independent edits and Undo through selection, length changes, removal and return',()=>{
 render(<App/>);change(`Message for ${bon}`,'  Exact letter\n👨‍👩‍👧‍👦  ');change(`Message for ${ron}`,'Senate edits');
 reset(bon);change('Congressional office',bentz.id);change('Message length','short');
 expect(editor(ron).value).toBe('Senate edits');change('Congressional office',bonamici.id);
 undo(bon);expect(editor(bon).value).toBe('  Exact letter\n👨‍👩‍👧‍👦  ');expect(document.activeElement).toBe(editor(bon));
 expect(editor(ron).value).toBe('Senate edits');
 change(`Message for ${bon}`,'');change('Congressional office',bentz.id);change('Congressional office',bonamici.id);expect(editor(bon).value).toBe('');
 reset(bon);undo(bon);expect(editor(bon).value).toBe('');
});

it('resets all selected drafts explicitly with independent Undo, leaving hidden drafts and social alone',()=>{
 render(<App/>);change(`Message for ${bon}`,'Hidden House draft');change('Congressional office',bentz.id);
 change(`Message for ${ron}`,'  Previous Senate\n ');change('Your social draft','Independent social');change('Message length','detailed');
 const previous=editor(jeff).value;
 fireEvent.click(screen.getByRole('button',{name:'Reset all selected messages'}));
 for(const name of ['Cliff Bentz',ron,jeff])expect(editor(name).value).toBe(renderBody(campaign,officials.find(o=>o.name===name)!,oregon,'detailed'));
 undo(ron);expect(editor(ron).value).toBe('  Previous Senate\n ');
 expect(editor(jeff).value).not.toBe(previous);undo(jeff);expect(editor(jeff).value).toBe(previous);
 change('Congressional office',bonamici.id);expect(editor(bon).value).toBe('Hidden House draft');
 expect(screen.getByLabelText<HTMLTextAreaElement>('Your social draft').value).toBe('Independent social');
});

it('initializes newly added offices with the current length and retains them after deselection',()=>{
 render(<App/>);change('Message length','short');
 fireEvent.click(screen.getByText('Choose additional offices or deselect recipients'));
 fireEvent.click(screen.getByRole('checkbox',{name:'Maxine Dexter — House OR-3'}));
 expect(editor('Maxine Dexter').value).toBe(renderBody(campaign,dexter,oregon,'short'));
 change('Message for Maxine Dexter','Keep this');
 fireEvent.click(screen.getByRole('checkbox',{name:'Maxine Dexter — House OR-3'}));change('Message length','detailed');
 fireEvent.click(screen.getByRole('checkbox',{name:'Maxine Dexter — House OR-3'}));expect(editor('Maxine Dexter').value).toBe('Keep this');
});

it('copies exactly the visible personalized editor and has no obsolete preview',async()=>{
 const writeText=vi.fn().mockResolvedValue(undefined);vi.stubGlobal('navigator',{clipboard:{writeText}});render(<App/>);
 change('Your name (optional)','Alex');change('City (optional)','Salem');
 for(const name of [bon,ron,jeff]){
  expect(editor(name).value.endsWith('\n\nSincerely,\nAlex\nSalem, Oregon')).toBe(true);
  fireEvent.click(card(name).getByRole('button',{name:'Copy message'}));await waitFor(()=>expect(writeText).toHaveBeenLastCalledWith(editor(name).value));
  expect(card(name).queryByText('Preview complete message')).toBeNull();
  expect(card(name).queryByRole('button',{name:'Copy complete message'})).toBeNull();
 }
});

it('keeps matching resets as no-ops and ends Undo only for the edited recipient',()=>{
 render(<App/>);reset(bon);expect(card(bon).queryByRole('button',{name:'Undo letter draft replacement'})).toBeNull();
 change(`Message for ${bon}`,'Old');change(`Message for ${ron}`,'Other');reset(bon);reset(ron);reset(bon);
 undo(bon);expect(editor(bon).value).toBe('Old');expect(card(ron).getByRole('button',{name:'Undo letter draft replacement'})).toBeTruthy();
 change(`Message for ${ron}`,'New');expect(card(ron).queryByRole('button',{name:'Undo letter draft replacement'})).toBeNull();
});

it('preserves accessible action groups and independently restores social and letter focus',()=>{
 render(<App/>);change(`Message for ${bon}`,'Letter');change('Your social draft','Social');reset(bon);fireEvent.click(screen.getByRole('button',{name:'Reset social draft'}));
 const button=card(bon).getByRole('button',{name:'Undo letter draft replacement'});expect(button.parentElement).toBe(card(bon).getByRole('button',{name:'Copy message'}).parentElement);
 expect(button.parentElement?.nextElementSibling?.getAttribute('aria-live')).toBe('polite');button.focus();expect(document.activeElement).toBe(button);fireEvent.click(button);expect(document.activeElement).toBe(editor(bon));
 fireEvent.click(screen.getByRole('button',{name:'Undo social draft replacement'}));expect(document.activeElement).toBe(screen.getByLabelText('Your social draft'));
});

it('handles clipboard failure without losing focus, selection or drafts',async()=>{
 vi.stubGlobal('navigator',{});Object.defineProperty(document,'execCommand',{configurable:true,value:vi.fn(()=>false)});render(<App/>);
 const input=editor(bon);input.focus();input.setSelectionRange(2,9,'backward');fireEvent.click(card(bon).getByRole('button',{name:'Copy message'}));
 await waitFor(()=>expect(card(bon).getAllByRole('status').some(s=>s.textContent?.includes('Copy unavailable'))).toBe(true));
 expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd,input.selectionDirection]).toEqual([2,9,'backward']);
 expect(document.querySelectorAll('textarea')).toHaveLength(4);
});

it('does not report a stale clipboard result after editing',async()=>{
 let finish!:()=>void;vi.stubGlobal('navigator',{clipboard:{writeText:()=>new Promise<void>(r=>{finish=r;})}});render(<App/>);
 fireEvent.click(card(bon).getByRole('button',{name:'Copy message'}));change(`Message for ${bon}`,'New');finish();
 await waitFor(()=>expect(card(bon).getAllByRole('status').every(s=>s.textContent==='')).toBe(true));
});

it('updates shared fields across hidden drafts while respecting recipient-specific manual personalization',()=>{
 render(<App/>);change('Your name (optional)','Alex');change('City (optional)','Salem');
 const bonOriginal=editor(bon).value;
 change(`Message for ${bon}`,bonOriginal.replace('Sincerely,\nAlex','With respect,\nAlex'));
 change(`Message for ${ron}`,editor(ron).value.replace('Salem, Oregon','My manually entered location'));
 change('Congressional office',bentz.id);
 change('Your name (optional)','Sam');change('City (optional)','Portland');change('Message length','short');
 change('Congressional office',bonamici.id);
 expect(editor(bon).value).toContain('With respect,\nAlex\nPortland, Oregon');
 expect(editor(ron).value).toContain('Sincerely,\nSam\nMy manually entered location');
 change('Your name (optional)','');change('City (optional)','');
 expect(editor(bon).value).toContain('With respect,\nAlex');expect(editor(bon).value).not.toContain('Portland');
 expect(editor(ron).value).not.toContain('Sincerely,');expect(editor(ron).value).toContain('My manually entered location');
 const before=editor(bon).value;reset(bon);expect(editor(bon).value).not.toContain('With respect,');undo(bon);expect(editor(bon).value).toBe(before);
});

it('preserves Undo across shared personalization changes and does not recreate removed signatures',()=>{
 render(<App/>);change('Your name (optional)','Alex');
 const original=editor(bon).value;change(`Message for ${bon}`,original.slice(0,original.indexOf('\n\nSincerely,')));
 const removed=editor(bon).value;reset(bon);change('Your name (optional)','Sam');undo(bon);
 expect(editor(bon).value).toBe(removed);
 change('Message length','short');change('City (optional)','Salem');
 expect(editor(bon).value).not.toContain('Sincerely,');expect(editor(bon).value).toBe(removed+'\n\nSalem, Oregon');
});

it('defaults to Short, offers only two lengths, and requires explicit replacement after switching',()=>{
 render(<App/>);
 const length=screen.getByRole<HTMLSelectElement>('combobox',{name:'Message length'});
 expect(length.value).toBe('short');
 expect(within(length).getAllByRole('option').map(o=>o.textContent)).toEqual(['Short','Detailed']);
 expect(screen.queryByRole('option',{name:'Standard'})).toBeNull();
 const original=editor(bon).value;
 change('Message length','detailed');expect(editor(bon).value).toBe(original);
 reset(bon);expect(editor(bon).value).toBe(renderBody(campaign,officials.find(o=>o.name===bon)!,oregon,'detailed'));
 expect(editor(ron).value).toBe(renderBody(campaign,officials.find(o=>o.name===ron)!,oregon,'short'));
 change('Message length','short');undo(bon);expect(editor(bon).value).toBe(original);
 expect(document.querySelector('#contact')?.textContent).not.toContain('Each office has its own editable House or Senate message.');
 for(const name of [bon,ron,jeff]){
  expect(editor(name).value.match(/Dear /g)).toHaveLength(1);
  expect(editor(name).value).not.toMatch(/\[Your Name\]|\[Your name\]|\[City\]|Sincerely,|Subject:/);
 }
 change('Your name (optional)','Alex');change('City (optional)','Salem');
 reset(bon);reset(bon);
 expect(editor(bon).value.match(/Sincerely,/g)).toHaveLength(1);
 expect(editor(bon).value.match(/Salem, Oregon/g)).toHaveLength(1);
});
