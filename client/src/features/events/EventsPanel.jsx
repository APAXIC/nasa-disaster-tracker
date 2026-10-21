
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPinIcon, ChevronDownIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { getCategoryStyle } from './categoryStyle.js';
import CategoryIcon from './CategoryIcon.jsx';
import {
  getDistance,
  getEventCategories,
  getEventDate,
  getMagnitudeInfo
} from './eventUtils';
import EventListItem from './EventListItem.jsx';
import EventSearchInput from './EventSearchInput.jsx';

const DEFAULT_DISPLAY_LIMIT = '';
const MAX_DISPLAY_LIMIT = 1000000;
const EVENT_FILTERS_KEY = 'disaster-map-event-filters';

function loadEventFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(EVENT_FILTERS_KEY) || '{}');
    return {
      query: typeof saved.query === 'string' ? saved.query : '',
      selectedCategories: Array.isArray(saved.selectedCategories) ? saved.selectedCategories.map(String) : (saved.selectedCategory ? [String(saved.selectedCategory)] : []),
      sortBy: ['newest', 'oldest', 'nearest', 'farthest', 'magnitude-asc', 'magnitude-desc'].includes(saved.sortBy) ? saved.sortBy : 'newest',
      displayLimitInput: typeof saved.displayLimitInput === 'string' ? saved.displayLimitInput : DEFAULT_DISPLAY_LIMIT
    };
  } catch {
    return { query: '', selectedCategories: [], sortBy: 'newest', displayLimitInput: DEFAULT_DISPLAY_LIMIT };
  }
}

function compareMissingLast(a, b, direction = 1) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  return (a - b) * direction;
}

function sortEvents(events, sortBy, userLocation) {
  if (sortBy !== 'newest' && sortBy !== 'oldest' &&
      sortBy !== 'nearest' && sortBy !== 'farthest' &&
      sortBy !== 'magnitude-asc' && sortBy !== 'magnitude-desc') {
    return events;
  }

  const decorated = events.map((event) => ({
    event,
    date: sortBy === 'newest' || sortBy === 'oldest'
      ? getEventDate(event)
      : null,
    distance: sortBy === 'nearest' || sortBy === 'farthest'
      ? getDistance(event, userLocation)
      : null,
    magnitude: sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc'
      ? getMagnitudeInfo(event)
      : null
  }));

  decorated.sort((a, b) => {
    let result = 0;

    if (sortBy === 'newest' || sortBy === 'oldest') {
      result = compareMissingLast(
        a.date,
        b.date,
        sortBy === 'newest' ? -1 : 1
      );
    } else if (sortBy === 'nearest' || sortBy === 'farthest') {
      result = compareMissingLast(
        a.distance,
        b.distance,
        sortBy === 'nearest' ? 1 : -1
      );
    } else {
      if (!a.magnitude && !b.magnitude) {
        result = 0;
      } else if (!a.magnitude) {
        result = 1;
      } else if (!b.magnitude) {
        result = -1;
      } else {
        const unitA = a.magnitude.unit || '';
        const unitB = b.magnitude.unit || '';

        result = unitA !== unitB
          ? unitA.localeCompare(unitB)
          : (a.magnitude.value - b.magnitude.value) *
            (sortBy === 'magnitude-asc' ? 1 : -1);
      }
    }

    return result || String(a.event.title ?? '').localeCompare(String(b.event.title ?? ''));
  });

  return decorated.map(({ event }) => event);
}

export default function EventsPanel({
                                      events = [],
                                      selectedEvent,
                                      onSelectEvent,
                                      onLocateUser,
                                      onResetSearch,
                                      isSearchingNearby,
                                      searchRadius,
                                      setSearchRadius,
                                      onDisplayEventsChange,
                                      userLocation
                                    }) {
  const [initialFilters] = useState(loadEventFilters);
  const [query, setQuery] = useState(initialFilters.query);
  const [selectedCategories, setSelectedCategories] = useState(initialFilters.selectedCategories);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);
  const [displayLimitInput, setDisplayLimitInput] = useState(initialFilters.displayLimitInput);

  useEffect(() => {
    try {
      localStorage.setItem(EVENT_FILTERS_KEY, JSON.stringify({
        query,
        selectedCategories,
        sortBy,
        displayLimitInput
      }));
    } catch (error) {
      console.error('Failed to save event filters:', error);
    }
  }, [query, selectedCategories, sortBy, displayLimitInput]);

  useEffect(() => {
    if (!sortMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!sortMenuRef.current?.contains(event.target)) setSortMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSortMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [sortMenuOpen]);

  const categories = useMemo(() => {
    const available = new Map();
    events.forEach((event) => {
      getEventCategories(event).forEach((category) => {
        if (category.id) available.set(category.id, category);
      });
    });
    return [...available.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [events]);

  const toggleCategory = (id) => {
    setSelectedCategories((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  };

  const cardRefs = useRef(new Map());

  const displayLimit = useMemo(() => {
    const trimmed = displayLimitInput.trim();

    if (!trimmed) return Infinity;

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed < 1) return Infinity;

    return Math.min(parsed, MAX_DISPLAY_LIMIT);
  }, [displayLimitInput]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = events.filter((event) => {
      const matchesQuery = String(event.title ?? '')
        .toLowerCase()
        .includes(normalizedQuery);

      const matchesCategory =
        selectedCategories.length === 0 ||
        getEventCategories(event).some(
          (category) => selectedCategories.includes(category.id)
        );

      return matchesQuery && matchesCategory;
    });

    return sortEvents(filtered, sortBy, userLocation).slice(0, displayLimit);
  }, [
    events,
    query,
    selectedCategories,
    sortBy,
    userLocation,
    displayLimit
  ]);

  useEffect(() => {
    onDisplayEventsChange?.(filteredEvents);
  }, [filteredEvents, onDisplayEventsChange]);

  useEffect(() => {
    if (!selectedEvent || !query.trim()) return;

    const selectedIsVisible = filteredEvents.some(
      (event) => String(event.id) === String(selectedEvent.id)
    );

    if (!selectedIsVisible) setQuery('');
  }, [selectedEvent?.id, filteredEvents, query]);

  useEffect(() => {
    if (!selectedEvent) return;

    cardRefs.current
      .get(String(selectedEvent.id))
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedEvent?.id, filteredEvents]);

  const locationAvailable =
    userLocation &&
    Number.isFinite(Number(userLocation.lat)) &&
    Number.isFinite(Number(userLocation.lng));

  return (
    <div className="events-panel-content space-y-5">
      <EventSearchInput query={query} onQueryChange={setQuery} />

      <div className="event-mode-switch" role="group" aria-label="Event scope">
        <button type="button" className={!isSearchingNearby ? 'is-active' : ''}
          aria-pressed={!isSearchingNearby} onClick={isSearchingNearby ? onResetSearch : undefined}>
          All events
        </button>
        <button type="button" className={isSearchingNearby ? 'is-active' : ''}
          aria-pressed={isSearchingNearby} onClick={!isSearchingNearby ? onLocateUser : undefined}>
          <MapPinIcon className="h-4 w-4" /> Nearby
        </button>
      </div>

      {isSearchingNearby && (
        <div className="nearby-radius-panel">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <label htmlFor="search-radius">Search radius</label>
            <span className="font-semibold text-blue-300">{searchRadius} km</span>
          </div>
          <input id="search-radius" type="range" min="100" max="5000" step="100"
            value={searchRadius} onChange={(event) => setSearchRadius(Number(event.target.value))}
            className="w-full accent-blue-500" />
          <span className="text-xs text-slate-500">Results update as you move the slider.</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium tracking-wide text-slate-400">Filter by category</h3>
          {selectedCategories.length > 0 && (
            <button type="button" className="text-xs text-blue-400 hover:text-blue-300"
              onClick={() => setSelectedCategories([])}>Clear filters</button>
          )}
        </div>
        <div className="category-filter-list" role="group" aria-label="Event categories">
          <button type="button" className={`category-chip ${selectedCategories.length === 0 ? 'is-active' : ''}`}
            aria-pressed={selectedCategories.length === 0} onClick={() => setSelectedCategories([])}>All</button>
          {categories.map((category) => {
            const style = getCategoryStyle(category);
            const active = selectedCategories.includes(category.id);
            return (
              <button type="button" key={category.id} aria-pressed={active}
                className={`category-chip ${active ? 'is-active' : ''}`}
                onClick={() => toggleCategory(category.id)}>
                <CategoryIcon category={category} />
                {category.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="event-advanced-controls">
        <div className="event-controls-grid">
          <div className="event-control-field" ref={sortMenuRef}>
            <label id="event-sort-label" className="event-control-label">Sort by</label>
            <button
              type="button"
              className="event-control-input event-sort-trigger"
              aria-labelledby="event-sort-label"
              aria-haspopup="listbox"
              aria-expanded={sortMenuOpen}
              onClick={() => setSortMenuOpen((open) => !open)}
            >
              <ArrowsUpDownIcon className="h-4 w-4 shrink-0" />
              <span className="event-sort-label truncate">{({
                newest: 'Last updated',
                oldest: 'Oldest first',
                'magnitude-desc': 'Highest magnitude',
                'magnitude-asc': 'Lowest magnitude',
                nearest: 'Nearest first',
                farthest: 'Farthest first'
              })[sortBy] || 'Last updated'}</span>
              <ChevronDownIcon className={`event-sort-chevron ml-auto h-4 w-4 shrink-0 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortMenuOpen && (
              <div className="event-sort-menu" role="listbox" aria-labelledby="event-sort-label">
                {[
                  ['newest', 'Last updated'],
                  ['oldest', 'Oldest first'],
                  ['magnitude-desc', 'Highest magnitude'],
                  ['magnitude-asc', 'Lowest magnitude'],
                  ...(locationAvailable ? [['nearest', 'Nearest first'], ['farthest', 'Farthest first']] : [])
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    role="option"
                    aria-selected={sortBy === value}
                    className={`event-sort-option ${sortBy === value ? 'is-selected' : ''}`}
                    onClick={() => { setSortBy(value); setSortMenuOpen(false); }}
                  >
                    <span>{label}</span>
                    {sortBy === value && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="event-control-field">
            <label htmlFor="event-display-limit" className="event-control-label">
              Event limit
            </label>
            <input
              id="event-display-limit"
              type="number"
              min="1"
              max={MAX_DISPLAY_LIMIT}
              step="1"
              value={displayLimitInput}
              placeholder="All events"
              title="Leave empty to show all available events"
              onChange={(event) => setDisplayLimitInput(event.target.value)}
              onBlur={() => {
                const trimmed = displayLimitInput.trim();
                if (!trimmed) { setDisplayLimitInput(''); return; }
                const parsed = Number(trimmed);
                if (!Number.isInteger(parsed) || parsed < 1) setDisplayLimitInput('');
                else if (parsed > MAX_DISPLAY_LIMIT) setDisplayLimitInput(String(MAX_DISPLAY_LIMIT));
              }}
              className="event-control-input"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
        <h3 className="text-sm font-semibold text-gray-200">Events</h3>
        <span className="text-xs text-gray-500">
          {filteredEvents.length} shown
          {filteredEvents.length !== events.length && ` · ${events.length} loaded`}
        </span>
      </div>

      <div className="space-y-2">
        {filteredEvents.map((event) => (
          <EventListItem
            key={event.id}
            event={event}
            isSelected={String(selectedEvent?.id) === String(event.id)}
            userLocation={userLocation}
            cardRefs={cardRefs}
            onSelectEvent={onSelectEvent}
          />
        ))}

        {filteredEvents.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No events match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
