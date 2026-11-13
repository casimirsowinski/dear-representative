import {afterEach, describe, expect, it} from 'vitest';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import App from '../App';
import OfficialAutocomplete from './OfficialAutocomplete';
import {legislators} from '../data/states';
import {oregonOfficial} from '../data/states/oregon';

afterEach(() => cleanup());

const wyden = oregonOfficial('Wyden');
const bonamici = oregonOfficial('Bonamici');

describe('OfficialAutocomplete', () => {
  it('filters by name without rendering every member option', () => {
    const seen: string[] = [];
    render(<OfficialAutocomplete officials={legislators} officialId={bonamici.id} onOfficialChange={id => seen.push(id)}/>);
    const input = screen.getByRole('combobox', {name: 'Congressional office'});
    fireEvent.focus(input);
    fireEvent.change(input, {target: {value: 'Wyden'}});
    const list = screen.getByRole('listbox', {name: 'Matching congressional offices'});
    const options = within(list).getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThanOrEqual(8);
    expect(options.some(option => option.textContent?.includes('Ron Wyden'))).toBe(true);
    expect(options.every(option => !option.textContent?.includes('Nancy Pelosi') || option.textContent?.toLowerCase().includes('wyden'))).toBe(true);
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(seen.at(-1)).toBe(wyden.id);
  });

  it('supports Escape to close and click selection from App', () => {
    render(<App/>);
    const input = screen.getByRole('combobox', {name: 'Congressional office'});
    fireEvent.focus(input);
    fireEvent.change(input, {target: {value: 'Pelosi'}});
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.change(input, {target: {value: 'Pelosi'}});
    fireEvent.mouseDown(screen.getByRole('option', {name: /Nancy Pelosi/}));
    expect(screen.getByRole('heading', {name: 'Nancy Pelosi'})).toBeTruthy();
    expect(screen.getByText('California congressional delegation')).toBeTruthy();
  });

  it('still accepts bioguide id changes used by existing composer tests', () => {
    render(<App/>);
    fireEvent.change(screen.getByLabelText('Congressional office'), {target: {value: wyden.id}});
    expect(screen.getByRole('heading', {name: 'Ron Wyden'})).toBeTruthy();
  });
});
