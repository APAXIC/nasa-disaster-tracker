import { XMarkIcon } from '@heroicons/react/24/outline';

export default function FloatingPanel({
  title,
  icon: Icon,
  onClose,
  children,
  width = 'w-[min(27rem,calc(100vw-6.5rem))]'
}) {
  return (
    <section
      aria-label={title}
      className={`modern-floating-panel absolute left-[5.75rem] top-5 z-30 flex max-h-[calc(100dvh-2.5rem)] ${width} flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl`}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-slate-700/40 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <Icon className="h-5 w-5 shrink-0 text-blue-400" />
          )}
          <h2 className="truncate text-xl font-semibold">{title}</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7 sm:py-7">
        {children}
      </div>
    </section>
  );
}