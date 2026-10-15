import { XMarkIcon } from '@heroicons/react/24/outline';

export default function FloatingPanel({
  title,
  icon: Icon,
  onClose,
  children,
  width = 'w-[min(24rem,calc(100vw-5rem))]'
}) {
  return (
    <section
      aria-label={title}
      className={`absolute left-16 top-0 z-30 flex h-full max-h-screen ${width} flex-col overflow-hidden border-r border-gray-700/70 bg-gray-900/95 text-white shadow-2xl backdrop-blur-xl`}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <Icon className="h-5 w-5 shrink-0 text-orange-400" />
          )}
          <h2 className="truncate text-base font-semibold">{title}</h2>
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

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </section>
  );
}