export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className="app-loading-spinner h-5 w-5 animate-spin rounded-full border-2"
      />
      <span className="app-loading-text">{label}</span>
    </div>
  );
}
