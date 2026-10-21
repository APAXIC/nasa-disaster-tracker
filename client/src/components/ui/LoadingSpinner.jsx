export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-orange-400"
      />
      <span>{label}</span>
    </div>
  );
}
