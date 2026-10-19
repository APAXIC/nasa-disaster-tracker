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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
