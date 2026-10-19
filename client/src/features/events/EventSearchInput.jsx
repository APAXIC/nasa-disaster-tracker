import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function EventSearchInput({ query, onQueryChange }) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

      <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search events..."
          aria-label="Search events"
          className="w-full rounded-xl border border-gray-700 bg-gray-800/80 py-3 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500"
      />
    </div>
  );
}
