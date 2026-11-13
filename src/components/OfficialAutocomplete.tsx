import {useEffect, useId, useRef, useState, type KeyboardEvent} from 'react';
import type {Legislator} from '../types';
import {formatOfficialOption} from '../data/states/current';
import {suggestOfficials} from '../lib/officialSearch';

type Props = {
  officials: Legislator[];
  officialId: string;
  onOfficialChange: (id: string) => void;
  label?: string;
};

const RESULT_LIMIT = 8;

export default function OfficialAutocomplete({
  officials,
  officialId,
  onOfficialChange,
  label = 'Congressional office',
}: Props) {
  const listId = useId();
  const selected = officials.find(o => o.id === officialId) ?? officials[0];
  const [query, setQuery] = useState(selected ? formatOfficialOption(selected) : '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = officials.find(o => o.id === officialId);
    if (next) setQuery(formatOfficialOption(next));
  }, [officialId, officials]);

  const suggestions = open
    ? (query.trim() ? suggestOfficials(officials, query, {limit: RESULT_LIMIT}) : officials.slice(0, RESULT_LIMIT))
    : [];

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function choose(official: Legislator) {
    onOfficialChange(official.id);
    setQuery(formatOfficialOption(official));
    setOpen(false);
    input.current?.focus();
  }

  function onChange(value: string) {
    // Tests (and any programmatic set) may pass a bioguide id directly.
    const byId = officials.find(o => o.id === value);
    if (byId) {
      choose(byId);
      return;
    }
    setQuery(value);
    setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {setOpen(true); return;}
      setHighlight(index => Math.min(index + 1, Math.max(suggestions.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {setOpen(true); return;}
      setHighlight(index => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      if (open && suggestions[highlight]) {
        event.preventDefault();
        choose(suggestions[highlight]);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      if (selected) setQuery(formatOfficialOption(selected));
    }
  }

  const activeId = open && suggestions[highlight] ? `${listId}-opt-${suggestions[highlight].id}` : undefined;

  return (
    <div className="official-autocomplete" ref={root}>
      <label>
        {label}
        <input
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder="Search by name"
          onChange={event => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && (
        <ul id={listId} role="listbox" className="official-autocomplete-list" aria-label="Matching congressional offices">
          {suggestions.length === 0 && (
            <li className="official-autocomplete-empty" role="presentation">No matching members</li>
          )}
          {suggestions.map((official, index) => (
            <li
              key={official.id}
              id={`${listId}-opt-${official.id}`}
              role="option"
              aria-selected={index === highlight || official.id === officialId}
              className={index === highlight ? 'is-active' : undefined}
              onMouseEnter={() => setHighlight(index)}
              onMouseDown={event => {
                event.preventDefault();
                choose(official);
              }}
            >
              {formatOfficialOption(official)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
