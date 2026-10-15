import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function EventsPanel({
                                      events = [],
                                      selectedEvent,
                                      onSelectEvent,
                                      onLocateUser,
                                      onResetSearch,
                                      isSearchingNearby,
                                      searchRadius,
                                      setSearchRadius
                                    }) {
  const [query, setQuery] = useState('');
  const cardRefs = useRef(new Map());

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) =>
      String(event.title ?? '').toLowerCase().includes(normalizedQuery)
    );
  }, [events, query]);

  useEffect(() => {
    if (!selectedEvent) return;

    const selectedIsVisible = filteredEvents.some(
      (event) => String(event.id) === String(selectedEvent.id)
    );

    if (!selectedIsVisible) {
      setQuery('');
    }
  }, [selectedEvent?.id, filteredEvents]);

  useEffect(() => {
    if (!selectedEvent) return;

    cardRefs.current
      .get(String(selectedEvent.id))
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedEvent?.id, filteredEvents]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events..."
          aria-label="Search events"
          className="w-full rounded-xl border border-gray-700 bg-gray-800/80 py-3 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500"
        />
      </div>

      <button
        type="button"
        onClick={onLocateUser}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        <MapPinIcon className="h-4 w-4" />
        Find Nearby Events
      </button>

      {isSearchingNearby && (
        <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-800/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="search-radius" className="text-gray-300">
              Search radius
            </label>
            <span className="font-semibold text-blue-400">
              {searchRadius} km
            </span>
          </div>

          <input
            id="search-radius"
            type="range"
            min="100"
            max="5000"
            step="100"
            value={searchRadius}
            onChange={(event) =>
              setSearchRadius(Number(event.target.value))
            }
            className="w-full accent-blue-500"
          />

          <button
            type="button"
            onClick={onResetSearch}
            className="flex items-center gap-2 text-xs text-gray-400 transition hover:text-white"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Show all global events
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-sm font-semibold text-gray-200">Events</h3>
        <span className="text-xs text-gray-500">
          {filteredEvents.length} results
        </span>
      </div>

      <div className="space-y-2">
        {filteredEvents.map((event) => {
          const isSelected =
            String(selectedEvent?.id) === String(event.id);

          return (
            <button
              key={event.id}
              ref={(element) => {
                const id = String(event.id);

                if (element) {
                  cardRefs.current.set(id, element);
                } else {
                  cardRefs.current.delete(id);
                }
              }}
              type="button"
              onClick={() => onSelectEvent(event)}
              aria-pressed={isSelected}
              className={`w-full rounded-xl border p-3 text-left transition ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/70'
              }`}
            >
              <span className="block text-sm font-medium text-gray-100">
                {event.title}
              </span>

              {event.distance_km != null && (
                <span className="mt-1 block text-xs text-blue-400">
                  {Math.round(event.distance_km)} km away
                </span>
              )}
            </button>
          );
        })}

        {filteredEvents.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No events match your search.
          </p>
        )}
      </div>
    </div>
  );
}