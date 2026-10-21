
import { useCallback, useEffect, useMemo, useState } from 'react';
import StatisticsFilters from './StatisticsFilters.jsx';
import CategoryStatistics from './CategoryStatistics.jsx';
import HistoricalEventsSection from './HistoricalEventsSection.jsx';
import {
  fetchHistoricalCategories,
  fetchHistoricalEvents
} from '../events/api.js';

const today = new Date().toISOString().slice(0, 10);

const defaultStart = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
})();

const DEFAULT_ANALYSIS_LIMIT = 10000;
const DEFAULT_DISPLAY_LIMIT = 100;

function getEventDate(event) {
  const geometries = event.geometry || [];

  for (let i = geometries.length - 1; i >= 0; i -= 1) {
    if (geometries[i]?.date) return geometries[i].date;
  }

  return event.closed || null;
}

function getEventTimestamp(event) {
  const date = getEventDate(event);
  if (!date) return null;

  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getEventCategories(event) {
  return (event.categories || [])
    .map((item) => item.title || item.name || item.id)
    .filter(Boolean);
}

function getMagnitudeInfo(event) {
  if (Number.isFinite(event.magnitudeValue)) {
    return {
      value: event.magnitudeValue,
      unit: event.magnitudeUnit || 'unit not provided'
    };
  }

  const geometries = event.geometry || [];

  for (let i = geometries.length - 1; i >= 0; i -= 1) {
    const geometry = geometries[i];

    if (Number.isFinite(geometry?.magnitudeValue)) {
      return {
        value: geometry.magnitudeValue,
        unit: geometry.magnitudeUnit || 'unit not provided'
      };
    }
  }

  return null;
}

function getEventCoordinates(event) {
  const geometries = event.geometry || [];

  for (let i = geometries.length - 1; i >= 0; i -= 1) {
    const coordinates = geometries[i]?.coordinates;
    const points = [];

    function collect(value) {
      if (
        Array.isArray(value) &&
        value.length >= 2 &&
        Number.isFinite(value[0]) &&
        Number.isFinite(value[1])
      ) {
        points.push([value[0], value[1]]);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(collect);
      }
    }

    collect(coordinates);

    if (points.length > 0) {
      const longitude =
        points.reduce((sum, point) => sum + point[0], 0) / points.length;
      const latitude =
        points.reduce((sum, point) => sum + point[1], 0) / points.length;

      return { lat: latitude, lng: longitude };
    }
  }

  return null;
}

function getDistanceKm(origin, destination) {
  if (!origin || !destination) return null;

  const values = [
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  ];

  if (!values.every(Number.isFinite)) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLng / 2) ** 2;

  const safeA = Math.min(1, Math.max(0, a));

  return earthRadiusKm * 2 * Math.atan2(
    Math.sqrt(safeA),
    Math.sqrt(1 - safeA)
  );
}

function getEventStatus(event) {
  return event.closed ? 'Closed' : 'Open';
}

function sortHistoricalEvents(events, sortBy, userLocation) {
  if (sortBy !== 'oldest' && sortBy !== 'newest' &&
      sortBy !== 'nearest' && sortBy !== 'farthest' &&
      sortBy !== 'magnitude-asc' && sortBy !== 'magnitude-desc') {
    return events;
  }

  const decorated = events.map((event) => ({
    event,
    timestamp: sortBy === 'oldest' || sortBy === 'newest'
      ? getEventTimestamp(event)
      : null,
    distance: sortBy === 'nearest' || sortBy === 'farthest'
      ? getDistanceKm(userLocation, getEventCoordinates(event))
      : null,
    magnitude: sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc'
      ? getMagnitudeInfo(event)
      : null
  }));

  decorated.sort((a, b) => {
    if (sortBy === 'oldest' || sortBy === 'newest') {
      if (a.timestamp === null && b.timestamp === null) return 0;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return sortBy === 'oldest'
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp;
    }

    if (sortBy === 'nearest' || sortBy === 'farthest') {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return sortBy === 'nearest'
        ? a.distance - b.distance
        : b.distance - a.distance;
    }

    if (!a.magnitude && !b.magnitude) return 0;
    if (!a.magnitude) return 1;
    if (!b.magnitude) return -1;

    const unitA = a.magnitude.unit.toLowerCase();
    const unitB = b.magnitude.unit.toLowerCase();

    if (unitA !== unitB) return unitA.localeCompare(unitB);

    const direction = sortBy === 'magnitude-asc' ? 1 : -1;
    return direction * (a.magnitude.value - b.magnitude.value);
  });

  return decorated.map(({ event }) => event);
}

export default function StatisticsPanel({ userLocation }) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(today);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');

  const [analysisLimit, setAnalysisLimit] = useState(
    String(DEFAULT_ANALYSIS_LIMIT)
  );
  const [displayLimit, setDisplayLimit] = useState(
    String(DEFAULT_DISPLAY_LIMIT)
  );
  const [sortBy, setSortBy] = useState('newest');

  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetchHistoricalCategories();
        const items = Array.isArray(response)
          ? response
          : response.data || response.categories || [];

        if (!cancelled) {
          setCategories(items);
        }
      } catch {
        if (!cancelled) {
          setCategoriesError(
            'Could not load categories. You can still search without a category filter.'
          );
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback(async (event) => {
    event?.preventDefault();

    if (!start || !end) {
      setError('Please select both dates.');
      return;
    }

    if (start > end) {
      setError('The start date must be before or equal to the end date.');
      return;
    }

    const parsedAnalysisLimit = analysisLimit.trim() === ''
      ? DEFAULT_ANALYSIS_LIMIT
      : Number(analysisLimit);

    const parsedDisplayLimit = displayLimit.trim() === ''
      ? DEFAULT_DISPLAY_LIMIT
      : Number(displayLimit);

    if (
      !Number.isInteger(parsedAnalysisLimit) ||
      parsedAnalysisLimit < 1 ||
      parsedAnalysisLimit > DEFAULT_ANALYSIS_LIMIT
    ) {
      setError('Analysis limit must be an integer between 1 and 10000.');
      return;
    }

    if (
      !Number.isInteger(parsedDisplayLimit) ||
      parsedDisplayLimit < 1 ||
      parsedDisplayLimit > DEFAULT_DISPLAY_LIMIT
    ) {
      setError('Display limit must be an integer between 1 and 100.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchHistoricalEvents({
        start,
        end,
        category,
        status,
        limit: parsedAnalysisLimit
      });

      const items = Array.isArray(response)
        ? response
        : response.data || response.events || [];

      setEvents(items);
      setResultCount(
        typeof response.totalFetched === 'number'
          ? response.totalFetched
          : items.length
      );
      setTruncated(Boolean(response.truncated));
      setHasSearched(true);
    } catch (err) {
      setEvents([]);
      setResultCount(0);
      setTruncated(false);
      setHasSearched(false);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to retrieve historical events. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [start, end, category, status, analysisLimit, displayLimit]);

  const categoryStats = useMemo(() => {
    const counts = new Map();

    for (const event of events) {
      const names = getEventCategories(event);

      if (names.length === 0) {
        counts.set('Uncategorized', (counts.get('Uncategorized') || 0) + 1);
        continue;
      }

      for (const name of names) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [events]);

  const maxCategoryCount = Math.max(
    1,
    ...categoryStats.map((item) => item.count)
  );

  const sortedEvents = useMemo(
    () => sortHistoricalEvents(events, sortBy, userLocation),
    [events, sortBy, userLocation]
  );

  const parsedDisplayLimit = displayLimit.trim() === ''
    ? DEFAULT_DISPLAY_LIMIT
    : Number(displayLimit);

  const safeDisplayLimit =
    Number.isInteger(parsedDisplayLimit) &&
    parsedDisplayLimit >= 1 &&
    parsedDisplayLimit <= DEFAULT_DISPLAY_LIMIT
      ? parsedDisplayLimit
      : DEFAULT_DISPLAY_LIMIT;

  const displayedEvents = useMemo(
    () => sortedEvents.slice(0, safeDisplayLimit),
    [sortedEvents, safeDisplayLimit]
  );

  const displayedEventRows = useMemo(
    () => displayedEvents.map((event) => {
      const coordinates = getEventCoordinates(event);

      return {
        event,
        categories: getEventCategories(event),
        magnitude: getMagnitudeInfo(event),
        coordinates,
        distanceKm: getDistanceKm(userLocation, coordinates),
        date: getEventDate(event),
        status: getEventStatus(event)
      };
    }),
    [displayedEvents, userLocation]
  );

  return (
    <section className="space-y-5 text-sm text-gray-200">
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500">
          NASA EONET
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Statistics & History
        </h2>
        <p className="mt-1 text-gray-400">
          Explore natural events across a selected period.
        </p>
      </div>

      <StatisticsFilters
        search={search}
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        today={today}
        category={category}
        setCategory={setCategory}
        categoriesLoading={categoriesLoading}
        categories={categories}
        categoriesError={categoriesError}
        status={status}
        setStatus={setStatus}
        analysisLimit={analysisLimit}
        setAnalysisLimit={setAnalysisLimit}
        displayLimit={displayLimit}
        setDisplayLimit={setDisplayLimit}
        sortBy={sortBy}
        setSortBy={setSortBy}
        userLocation={userLocation}
        loading={loading}
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900/70 bg-red-950/40 p-3 text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
          <p className="text-xs text-gray-400">Events analyzed</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {resultCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
          <p className="text-xs text-gray-400">Categories found</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {categoryStats.length}
          </p>
        </div>
      </div>

      {truncated && (
        <p className="text-xs text-amber-300">
          The result set reached the requested analysis limit. More events may exist outside this result set.
        </p>
      )}

      <CategoryStatistics
        hasSearched={hasSearched}
        categoryStats={categoryStats}
        loading={loading}
        maxCategoryCount={maxCategoryCount}
      />

      <HistoricalEventsSection
        hasSearched={hasSearched}
        displayedEvents={displayedEvents}
        events={events}
        loading={loading}
        displayedEventRows={displayedEventRows}
      />
    </section>
  );
}
