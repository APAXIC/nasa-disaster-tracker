export default function CategoryStatistics({ hasSearched, categoryStats, loading, maxCategoryCount }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
        <h3 className="font-semibold text-white">Events by category</h3>

        {!hasSearched ? (
          <p className="mt-3 text-gray-500">
            Set your filters and select Apply filters to generate statistics.
          </p>
        ) : categoryStats.length === 0 ? (
          <p className="mt-3 text-gray-500">
            {loading
              ? 'Calculating statistics...'
              : 'No category data available for this search.'}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {categoryStats.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="truncate text-gray-300">{item.name}</span>
                  <span className="tabular-nums text-gray-400">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{
                      width: `${(item.count / maxCategoryCount) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
