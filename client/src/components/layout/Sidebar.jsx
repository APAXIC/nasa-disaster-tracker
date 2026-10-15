import {
  UserIcon,
  ArrowLeftEndOnRectangleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  BellIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  { id: 'events', label: 'Events', icon: ExclamationTriangleIcon },
  { id: 'watch-zones', label: 'Watch Zones', icon: MapPinIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'settings', label: 'Settings', icon: AdjustmentsHorizontalIcon }
];

function SidebarButton({
                         label,
                         icon: Icon,
                         active = false,
                         badge,
                         onClick
                       }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition ${
        active
          ? 'bg-gray-100 text-gray-950'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="h-6 w-6" />

      {badge > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({
                                  activePanel,
                                  onPanelChange,
                                  user,
                                  onOpenAuthModal,
                                  onLogout,
                                  unreadNotificationsCount = 0
                                }) {
  const handlePanelClick = (panelId) => {
    onPanelChange(activePanel === panelId ? null : panelId);
  };

  return (
    <nav
      aria-label="Main navigation"
      className="absolute inset-y-0 left-0 z-40 flex w-16 flex-col items-center border-r border-gray-800 bg-gray-950/95 py-3 backdrop-blur-xl"
    >
      <div className="mb-5">
        <SidebarButton
          label="Close active panel"
          icon={XMarkIcon}
          active={activePanel === null}
          onClick={() => onPanelChange(null)}
        />
      </div>

      <div className="flex flex-1 flex-col items-center gap-2">
        {navigationItems.map(({ id, label, icon }) => (
          <SidebarButton
            key={id}
            label={label}
            icon={icon}
            active={activePanel === id}
            badge={
              id === 'notifications'
                ? unreadNotificationsCount
                : 0
            }
            onClick={() => handlePanelClick(id)}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-gray-800 pt-4">
        <SidebarButton
          label={user ? 'Log Out' : 'Sign In'}
          icon={user ? ArrowLeftEndOnRectangleIcon : UserIcon}
          onClick={user ? onLogout : onOpenAuthModal}
        />
      </div>
    </nav>
  );
}