import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppTopBar } from './components/layout/AppTopBar';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { SplashScreen } from './components/common/SplashScreen';
import { Toast } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { StorageService } from './services/storageService';
import { UserPreferences } from './types';
import { RefreshCw } from 'lucide-react';

const HomeScreen = lazy(() => import('./views/HomeScreen').then((m) => ({ default: m.HomeScreen })));
const ToolsScreen = lazy(() => import('./views/ToolsScreen').then((m) => ({ default: m.ToolsScreen })));
const HistoryScreen = lazy(() => import('./views/HistoryScreen').then((m) => ({ default: m.HistoryScreen })));
const SettingsScreen = lazy(() => import('./views/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
const ToolWorkspaceScreen = lazy(() => import('./views/ToolWorkspaceScreen').then((m) => ({ default: m.ToolWorkspaceScreen })));

const MAIN_TAB_PATHS = ['/', '/tools', '/history', '/settings'];

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--accent-primary)' }}>
    <RefreshCw size={28} style={{ animation: 'spin 1.5s linear infinite' }} />
  </div>
);

const BackButtonHandler: React.FC<{ onShowToast: (msg: string) => void }> = ({ onShowToast }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let lastTime = 0;

    const setupListener = async () => {
      const listenerHandle = await CapacitorApp.addListener('backButton', () => {
        // 1. If any modal is active with data-close-modal="true", click its close button
        const closeModalBtn = document.querySelector('[data-close-modal="true"]') as HTMLElement | null;
        if (closeModalBtn) {
          closeModalBtn.click();
          return;
        }

        // 2. Dispatch custom back event to let active views intercept if needed
        const customEvent = new CustomEvent('nlab-back-button', { cancelable: true });
        const wasHandled = !window.dispatchEvent(customEvent);
        if (wasHandled) {
          return;
        }

        // 3. Page navigation handling
        if (location.pathname !== '/') {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate('/');
          }
        } else {
          // On Home screen: Double press within 2s to exit app
          const now = Date.now();
          if (now - lastTime < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastTime = now;
            onShowToast('Press back again to exit app');
          }
        }
      });

      return listenerHandle;
    };

    let handlePromise: Promise<any> | null = null;
    if (Capacitor.isNativePlatform()) {
      handlePromise = setupListener();
    }

    return () => {
      if (handlePromise) {
        handlePromise.then((handle) => handle.remove());
      }
    };
  }, [location, navigate, onShowToast]);

  return null;
};

interface AnimatedRoutesProps {
  prefs: UserPreferences;
  onUpdatePrefs: (updated: Partial<UserPreferences>) => void;
}

const AnimatedRoutes: React.FC<AnimatedRoutesProps> = ({ prefs, onUpdatePrefs }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/tools" element={<ToolsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route
            path="/settings"
            element={<SettingsScreen prefs={prefs} onUpdatePrefs={onUpdatePrefs} />}
          />
          <Route path="/workspace/:toolId" element={<ToolWorkspaceScreen />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const AppShell: React.FC<{
  prefs: UserPreferences;
  onUpdatePrefs: (updated: Partial<UserPreferences>) => void;
  onToggleTheme: () => void;
  showSplash: boolean;
  onFinishSplash: () => void;
}> = ({ prefs, onUpdatePrefs, onToggleTheme, showSplash, onFinishSplash }) => {
  const location = useLocation();
  const [appToastMsg, setAppToastMsg] = useState<string | null>(null);
  const isBottomNavVisible = MAIN_TAB_PATHS.includes(location.pathname);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setAppToastMsg(detail);
    };
    window.addEventListener('nlab-show-toast', handleToastEvent);
    return () => window.removeEventListener('nlab-show-toast', handleToastEvent);
  }, []);

  return (
    <>
      <BackButtonHandler onShowToast={(msg) => setAppToastMsg(msg)} />
      <Toast message={appToastMsg} onClose={() => setAppToastMsg(null)} />
      {showSplash && <SplashScreen onFinish={onFinishSplash} />}
      <div className="app-container">
        <AppTopBar themeMode={prefs.themeMode} onToggleTheme={onToggleTheme} />

        <main className={`main-content ${isBottomNavVisible ? 'has-bottom-nav' : ''}`}>
          <AnimatedRoutes prefs={prefs} onUpdatePrefs={onUpdatePrefs} />
        </main>

        <BottomNavBar />
      </div>
    </>
  );
};


export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [prefs, setPrefs] = useState<UserPreferences>(() => StorageService.getPreferences());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.themeMode);

    // Native Capacitor Fullscreen Status Bar Overlay Configuration
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: prefs.themeMode === 'dark' ? Style.Dark : Style.Light });
      } catch (err) {
        console.warn('StatusBar overlay configuration skipped:', err);
      }
    }
  }, [prefs.themeMode]);

  const handleUpdatePrefs = (updated: Partial<UserPreferences>) => {
    const newPrefs = StorageService.savePreferences(updated);
    setPrefs(newPrefs);
  };

  const handleToggleTheme = () => {
    const newMode = prefs.themeMode === 'dark' ? 'light' : 'dark';
    handleUpdatePrefs({ themeMode: newMode });
  };

  return (
    <ErrorBoundary>
      <Router>
        <AppShell
          prefs={prefs}
          onUpdatePrefs={handleUpdatePrefs}
          onToggleTheme={handleToggleTheme}
          showSplash={showSplash}
          onFinishSplash={() => setShowSplash(false)}
        />
      </Router>
    </ErrorBoundary>
  );
};

export default App;

