import { memo } from 'react';
import {
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  BellIcon,
  BellSlashIcon
} from '@heroicons/react/24/outline';

function WatchZoneCard({ zone, onEdit, onDelete, onToggleNotifications, isSubmitting, deletingZoneId, togglingZoneId }) {
  const isDeleting = deletingZoneId === zone.id;
  const isToggling = togglingZoneId === zone.id;

  return (
    <article className="watch-zone-card rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5 transition hover:border-slate-600">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10">
          <MapPinIcon className="h-6 w-6 text-orange-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="break-words text-base font-semibold leading-6 text-slate-100">{zone.name}</h4>
          <p className="mt-1 text-sm text-slate-400">{zone.radius_km} km radius</p>
          <p className="mt-1 break-words text-xs leading-5 text-slate-500">
            {Number(zone.latitude).toFixed(4)}, {Number(zone.longitude).toFixed(4)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => onEdit(zone)} disabled={isSubmitting || isDeleting} title="Edit watch zone" aria-label={`Edit ${zone.name}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 text-slate-300 transition hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50">
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => onDelete(zone)} disabled={isSubmitting || isDeleting} title="Delete watch zone" aria-label={`Delete ${zone.name}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 text-slate-300 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200">Zone notifications</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {zone.is_muted ? 'Notifications are muted' : 'Notifications are enabled'}
          </p>
        </div>
        <button type="button" onClick={() => onToggleNotifications(zone)} disabled={togglingZoneId !== null || isSubmitting || isDeleting} aria-pressed={!zone.is_muted} aria-label={zone.is_muted ? `Enable notifications for ${zone.name}` : `Mute notifications for ${zone.name}`} className={`watch-zone-toggle inline-flex shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${zone.is_muted ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
          {zone.is_muted ? <BellSlashIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
          {isToggling ? 'Saving...' : zone.is_muted ? 'Enable' : 'Mute'}
        </button>
      </div>
      {isDeleting && <p className="mt-3 text-sm text-slate-400">Deleting...</p>}
    </article>
  );
}

export default memo(WatchZoneCard);
