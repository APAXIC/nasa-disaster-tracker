import LoadingSpinner from './components/ui/LoadingSpinner.jsx';
import Map from './features/map/Map.jsx';
import AuthModal from './features/auth/AuthModal.jsx';
import AppShell from './components/layout/AppShell.jsx';
import useAppController from './app/useAppController.js';
import { createPanelConfig } from './app/panelConfig.jsx';

export default function App() {
  const controller = useAppController();
  const {
    activePanel,
    setActivePanel,
    user,
    unreadNotificationsCount,
    isAuthModalOpen,
    setIsAuthModalOpen,
    displayEvents,
    isEventsLoading,
    selectedEvent,
    setSelectedEvent,
    userLocation,
    watchZones,
    searchRadius,
    isSearchingNearby,
    mapSettings,
    isPickingWatchZoneLocation,
    handleWatchZoneLocationSelect,
    watchZonePreview,
    handleAuthSuccess,
    handleLogout
  } = controller;

  const panelConfig = createPanelConfig(controller);
  const currentPanel = activePanel ? panelConfig[activePanel] : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-950">
      <AppShell
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadNotificationsCount}
        panelTitle={currentPanel?.title}
        panelIcon={currentPanel?.icon}
        panelContent={currentPanel?.content}
      >
        <Map
          events={displayEvents}
          userLocation={userLocation}
          watchZones={watchZones}
          searchRadius={searchRadius}
          selectedEvent={selectedEvent}
          isSearchingNearby={isSearchingNearby}
          onSelectEvent={setSelectedEvent}
          mapSettings={mapSettings}
          isPickingWatchZoneLocation={isPickingWatchZoneLocation}
          onWatchZoneLocationSelect={handleWatchZoneLocationSelect}
          watchZonePreview={watchZonePreview}
        />
      </AppShell>

      {isEventsLoading && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-950/55 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-900/95 px-5 py-4 text-sm font-medium text-white shadow-2xl">
            <LoadingSpinner label="Loading disaster events..." />
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
