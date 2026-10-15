import Sidebar from './Sidebar';
import FloatingPanel from './FloatingPanel';

export default function AppShell({
                                   children,
                                   activePanel,
                                   onPanelChange,
                                   user,
                                   onOpenAuthModal,
                                   onLogout,
                                   unreadNotificationsCount,
                                   panelContent,
                                   panelTitle,
                                   panelIcon
                                 }) {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        {children}
      </div>

      <Sidebar
        activePanel={activePanel}
        onPanelChange={onPanelChange}
        user={user}
        onOpenAuthModal={onOpenAuthModal}
        onLogout={onLogout}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {activePanel && (
        <FloatingPanel
          title={panelTitle}
          icon={panelIcon}
          onClose={() => onPanelChange(null)}
        >
          {panelContent}
        </FloatingPanel>
      )}
    </main>
  );
}