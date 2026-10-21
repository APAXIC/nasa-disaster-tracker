import { useEffect, useRef, useState } from 'react';
import { ArrowsUpDownIcon, CalendarDaysIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getCategoryStyle } from '../events/categoryStyle.js';
import CategoryIcon from '../events/CategoryIcon.jsx';

const dateToEuropean = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || '')
  ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';

function europeanToDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T12:00:00`);
  return date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month)
    && date.getDate() === Number(day) ? iso : null;
}

function EuropeanDateInput({ label, value, onChange, min, max }) {
  const [draft, setDraft] = useState(() => dateToEuropean(value));
  const [invalid, setInvalid] = useState(false);
  const nativeRef = useRef(null);
  useEffect(() => { setDraft(dateToEuropean(value)); setInvalid(false); }, [value]);
  const commit = () => {
    const iso = europeanToDate(draft);
    if (!iso || (min && iso < min) || (max && iso > max)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(iso);
    setDraft(dateToEuropean(iso));
  };
  return (
    <div className="statistics-field">
      <label className="statistics-label" htmlFor={`stats-${label}`}>{label}</label>
      <div className={`statistics-date-wrap ${invalid ? 'is-invalid' : ''}`}>
        <input id={`stats-${label}`} type="text" inputMode="numeric" placeholder="DD/MM/YYYY"
          value={draft} onChange={(event) => { setDraft(event.target.value); setInvalid(false); }}
          onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }}
          aria-invalid={invalid} aria-label={`${label} date (day/month/year)`} />
        <button type="button" className="statistics-calendar-button" aria-label={`Choose ${label.toLowerCase()} date`}
          onClick={() => { if (nativeRef.current?.showPicker) nativeRef.current.showPicker(); else nativeRef.current?.focus(); }}>
          <CalendarDaysIcon className="h-[18px] w-[18px]" />
        </button>
        <input ref={nativeRef} className="statistics-native-date" tabIndex={-1} aria-hidden="true"
          type="date" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} />
      </div>
      {invalid && <span className="statistics-error">Enter a valid date (DD/MM/YYYY).</span>}
    </div>
  );
}

function SortSelect({ value, onChange, userLocation }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const options = [
    ['newest', 'Newest first'], ['oldest', 'Oldest first'],
    ['magnitude-desc', 'Magnitude: high to low'], ['magnitude-asc', 'Magnitude: low to high'],
    ...(userLocation ? [['nearest', 'Nearest to me'], ['farthest', 'Farthest from me']] : [])
  ];
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  return (
    <div className="statistics-sort-wrap" ref={wrapperRef}>
      <button type="button" className="statistics-sort-trigger" aria-expanded={open} aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}>
        <ArrowsUpDownIcon className="statistics-sort-icon" />
        <span className="statistics-sort-text">{options.find(([id]) => id === value)?.[1] || 'Newest first'}</span>
        <ChevronDownIcon className="statistics-sort-chevron" />
      </button>
      {open && <div role="listbox" aria-label="Sort events" className="statistics-sort-menu">
        {options.map(([id, title]) => (
          <button key={id} type="button" role="option" aria-selected={id === value}
            className={`statistics-sort-option ${id === value ? 'is-selected' : ''}`}
            onClick={() => { onChange(id); setOpen(false); }}>
            <span>{title}</span>{id === value && <CheckIcon className="h-4 w-4" />}
          </button>
        ))}
      </div>}
    </div>
  );
}

export default function StatisticsFilters({
  search, start, setStart, end, setEnd, today, category, setCategory,
  categoriesLoading, categories, categoriesError, status, setStatus,
  analysisLimit, setAnalysisLimit, displayLimit, setDisplayLimit,
  sortBy, setSortBy, userLocation, loading
}) {
  return (
    <form onSubmit={search} className="statistics-filters">
      <div className="statistics-date-grid">
        <EuropeanDateInput label="From" value={start} onChange={setStart} max={end || today} />
        <EuropeanDateInput label="To" value={end} onChange={setEnd} min={start} max={today} />
      </div>

      <fieldset className="statistics-field">
        <legend className="statistics-label">Filter by category</legend>
        <div className="statistics-chip-list">
          <button type="button" aria-pressed={!category} onClick={() => setCategory('')}
            className={`statistics-chip ${!category ? 'is-active' : ''}`}>All</button>
          {categories.map((item) => {
            const id = String(item.id || item.title || item.name || '');
            const name = item.title || item.name || id;
            const style = getCategoryStyle(name);
            return <button key={id} type="button" aria-pressed={String(category) === id}
              onClick={() => setCategory(String(category) === id ? '' : id)}
              className={`statistics-chip ${String(category) === id ? 'is-active' : ''}`}>
              <CategoryIcon category={name} />{name}
            </button>;
          })}
        </div>
        {categoriesLoading && <span className="statistics-hint">Loading categories...</span>}
        {categoriesError && <span className="statistics-error">{categoriesError}</span>}
      </fieldset>

      <fieldset className="statistics-field">
        <legend className="statistics-label">Event status</legend>
        <div className="statistics-chip-list">
          {[['all', 'All events'], ['open', 'Open'], ['closed', 'Closed']].map(([id, title]) => (
            <button key={id} type="button" aria-pressed={status === id}
              onClick={() => setStatus(id)} className={`statistics-chip ${status === id ? 'is-active' : ''}`}>
              {title}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="statistics-limits-grid">
        <label className="statistics-field">
          <span className="statistics-label">Analysis limit</span>
          <input type="number" min="1" max="10000" step="1" value={analysisLimit}
            onChange={(event) => setAnalysisLimit(event.target.value)} placeholder="10000"
            className="statistics-input" />
          <span className="statistics-hint">1–10,000 · default 10,000</span>
        </label>
        <label className="statistics-field">
          <span className="statistics-label">Display limit</span>
          <input type="number" min="1" max="100" step="1" value={displayLimit}
            onChange={(event) => setDisplayLimit(event.target.value)} placeholder="100"
            className="statistics-input" />
          <span className="statistics-hint">1–100 · default 100</span>
        </label>
      </div>

      <div className="statistics-field">
        <span className="statistics-label">Sort events</span>
        <SortSelect value={sortBy} onChange={setSortBy} userLocation={userLocation} />
        {(sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc') &&
          <span className="statistics-hint">Magnitudes with different units are grouped separately.</span>}
      </div>

      <button type="submit" disabled={loading} className="statistics-apply-button">
        {loading ? 'Loading events...' : 'Apply filters'}
      </button>
    </form>
  );
}
