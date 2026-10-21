export default function CategoryStatistics({ hasSearched, categoryStats, loading, maxCategoryCount }) {
  return (
    <section className="statistics-category-card">
      <h3>Events by category</h3>
      {!hasSearched ? <p className="statistics-hint">Apply filters to generate statistics.</p>
        : categoryStats.length === 0 ? <p className="statistics-hint">
          {loading ? 'Calculating statistics...' : 'No category data available for this search.'}
        </p> : <div className="statistics-category-bars">
          {categoryStats.map((item) => <div key={item.name} className="statistics-category-row">
            <div className="statistics-category-label"><span>{item.name}</span><span>{item.count.toLocaleString()}</span></div>
            <div className="statistics-category-track"><div style={{ width: `${(item.count / maxCategoryCount) * 100}%` }} /></div>
          </div>)}
        </div>}
    </section>
  );
}
