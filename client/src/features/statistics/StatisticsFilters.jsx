export default function StatisticsFilters({
  search, start, setStart, end, setEnd, today, category, setCategory,
  categoriesLoading, categories, categoriesError, status, setStatus,
  analysisLimit, setAnalysisLimit, displayLimit, setDisplayLimit,
  sortBy, setSortBy, userLocation, loading
}) {
  return (
    <form
        onSubmit={search}
        className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-400">From</span>
            <input
              type="date"
              value={start}
              max={end || today}
              onChange={(event) => setStart(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2 py-2 text-xs text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-gray-400">To</span>
            <input
              type="date"
              value={end}
              min={start}
              max={today}
              onChange={(event) => setEnd(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2 py-2 text-xs text-white"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={categoriesLoading}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option
                key={item.id || item.title}
                value={item.id || item.title}
              >
                {item.title || item.name || item.id}
              </option>
            ))}
          </select>
          {categoriesError && (
            <span className="mt-1 block text-xs text-amber-300">
              {categoriesError}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">Event status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="all">All events</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">
            Events for analysis (1–10,000)
          </span>
          <input
            type="number"
            min="1"
            max="10000"
            step="1"
            value={analysisLimit}
            onChange={(event) => setAnalysisLimit(event.target.value)}
            placeholder="10000"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          />
          <span className="mt-1 block text-xs text-gray-500">
            Leave empty to use 10,000.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">
            Events to display (1–100)
          </span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={displayLimit}
            onChange={(event) => setDisplayLimit(event.target.value)}
            placeholder="100"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          />
          <span className="mt-1 block text-xs text-gray-500">
            Leave empty to display up to 100.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">Sort events</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="magnitude-desc">
              Magnitude: high to low (grouped by unit)
            </option>
            <option value="magnitude-asc">
              Magnitude: low to high (grouped by unit)
            </option>
            {userLocation && (
              <>
                <option value="nearest">Nearest to me</option>
                <option value="farthest">Farthest from me</option>
              </>
            )}
          </select>
          {(sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc') && (
            <span className="mt-1 block text-xs text-gray-500">
              Values with different units are grouped separately, not compared as one scale.
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-500 px-4 py-2.5 font-medium text-white transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? 'Loading events...' : 'Apply filters'}
        </button>
    </form>
  );
}
