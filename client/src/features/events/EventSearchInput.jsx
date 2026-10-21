import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function EventSearchInput({ query, onQueryChange }) {
  return (
    <div className="event-search-field relative">
      <MagnifyingGlassIcon className="event-search-icon pointer-events-none h-5 w-5 text-gray-500" />

      <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search events or locations..."
          aria-label="Search events"
          className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 h-12 py-3 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
      />
    </div>
  );
}
