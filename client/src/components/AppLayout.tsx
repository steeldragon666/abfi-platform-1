/**
 * AppLayout - Main application layout with portal-based navigation
 * New layout structure: TopBar + Sidebar + Main Content
 * Enhanced with trust indicators, offline support, and accessibility features
 *
 * Note: Legacy navigation can be enabled with localStorage.setItem('nav-v2', 'false')
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapControlsProvider } from "@/contexts/MapControlsContext";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { MapControlsPanel } from "@/components/layout/MapControlsPanel";
import { useIsMobile } from "@/hooks/useMobile";
// Trust indicators removed for cleaner UI - can be re-enabled in settings
// import { FloatingSecurityIndicator, TrustFooter } from "@/components/Trust";
import { OfflineToast, ConnectionStatus } from "@/components/Offline";
import { useLocation } from "wouter";
import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userRole = user?.role || 'buyer';
  const isMobile = useIsMobile();
  const [location] = useLocation();

  // Nav-v2 is now the default. Set localStorage 'nav-v2' to 'false' to use legacy nav
  const [useNewNav, setUseNewNav] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('nav-v2') !== 'false';
  });

  // Online/offline status tracking
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine portal theme based on current route
  const getPortalTheme = () => {
    if (location.startsWith('/grower') || location.startsWith('/for-growers')) return 'portal-grower';
    if (location.startsWith('/developer') || location.startsWith('/for-developers')) return 'portal-developer';
    if (location.startsWith('/lender') || location.startsWith('/for-lenders')) return 'portal-lender';
    if (location.startsWith('/admin') || location.startsWith('/compliance')) return 'portal-government';
    return '';
  };

  // Use new portal-based navigation when feature flag is enabled
  if (useNewNav) {
    return (
      <PortalLayout>
        {children}
        {/* Offline Toast Notification */}
        <OfflineToast
          isVisible={showOfflineToast}
          onDismiss={() => setShowOfflineToast(false)}
        />
      </PortalLayout>
    );
  }

  // Legacy navigation layout
  return (
    <MapControlsProvider userRole={userRole}>
      <div className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden ${getPortalTheme()}`}>
        {/* Skip to main content link for keyboard accessibility */}
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>

        {/* Portal indicator bar - shows current portal theme */}
        {getPortalTheme() && (
          <div className="portal-indicator" aria-hidden="true" />
        )}

        {/* Top Navigation Bar with Connection Status */}
        <TopNavigation />

        {/* Main Content Area with Map Controls Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Map Controls Panel (left side) - hidden on mobile */}
          {!isMobile && <MapControlsPanel />}

          {/* Main Content */}
          <main
            id="main-content"
            className="flex-1 overflow-auto"
            tabIndex={-1}
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>

        {/* Offline Toast Notification */}
        <OfflineToast
          isVisible={showOfflineToast}
          onDismiss={() => setShowOfflineToast(false)}
        />
      </div>
    </MapControlsProvider>
  );
}
