import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { ALL_TOOLS } from '../data/toolRegistry';
import { UserPreferences } from '../types';
import { Toast } from '../components/common/Toast';
import {
  Sun,
  Moon,
  Shield,
  Info,
  HardDrive,
  Star,
  Sliders,
  RotateCcw,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface SettingsScreenProps {
  prefs: UserPreferences;
  onUpdatePrefs: (updated: Partial<UserPreferences>) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ prefs, onUpdatePrefs }) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);

  useEffect(() => {
    setFavoriteIds(StorageService.getFavorites());
    setHistoryCount(StorageService.getHistory().length);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleClearFavorites = () => {
    StorageService.clearFavorites();
    setFavoriteIds([]);
    onUpdatePrefs({ favoriteToolIds: [] });
    showToast('Starred favorites list cleared.');
  };

  const handleRemoveFavoriteItem = (id: string) => {
    const updated = StorageService.toggleFavorite(id);
    setFavoriteIds(updated);
    onUpdatePrefs({ favoriteToolIds: updated });
    showToast('Tool removed from favorites.');
  };

  const handleClearHistory = () => {
    StorageService.clearHistory();
    setHistoryCount(0);
    showToast('History clipboard cleared.');
  };

  const handleResetDefaults = () => {
    const defaultPrefs = StorageService.resetPreferences();
    onUpdatePrefs(defaultPrefs);
    setFavoriteIds(defaultPrefs.favoriteToolIds);
    showToast('All app preferences reset to factory defaults!');
  };

  const favoriteTools = ALL_TOOLS.filter((t) => favoriteIds.includes(t.id));

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Preferences & Controls
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Full customization options, naming rules & engine storage controls
        </p>
      </div>

      {/* SECTION 1: APPEARANCE THEME */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sun size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Interface Theme</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button
            className={`btn-secondary ${prefs.themeMode === 'dark' ? 'active' : ''}`}
            onClick={() => {
              onUpdatePrefs({ themeMode: 'dark' });
              showToast('Theme set to Dark Mode');
            }}
            style={{
              justifyContent: 'center',
              borderColor: prefs.themeMode === 'dark' ? 'var(--accent-primary)' : 'var(--border-color)',
              background: prefs.themeMode === 'dark' ? 'var(--accent-primary-container)' : 'var(--bg-secondary)',
              color: prefs.themeMode === 'dark' ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            <Moon size={16} />
            <span>Dark Mode</span>
          </button>

          <button
            className={`btn-secondary ${prefs.themeMode === 'light' ? 'active' : ''}`}
            onClick={() => {
              onUpdatePrefs({ themeMode: 'light' });
              showToast('Theme set to Light Mode');
            }}
            style={{
              justifyContent: 'center',
              borderColor: prefs.themeMode === 'light' ? 'var(--accent-primary)' : 'var(--border-color)',
              background: prefs.themeMode === 'light' ? 'var(--accent-primary-container)' : 'var(--bg-secondary)',
              color: prefs.themeMode === 'light' ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            <Sun size={16} />
            <span>Light Mode</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: COMPRESSION & QUALITY ENGINE DEFAULTS */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Engine Quality Defaults
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            <span>Default Image Compression Quality</span>
            <span style={{ color: 'var(--accent-primary)' }}>{prefs.compressionQuality}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={prefs.compressionQuality}
            onChange={(e) => onUpdatePrefs({ compressionQuality: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
            PDF Export Stream Compression
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['low', 'medium', 'high'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  onUpdatePrefs({ pdfCompression: lvl });
                  showToast(`PDF compression set to ${lvl.toUpperCase()}`);
                }}
                className={`segmented-option ${prefs.pdfCompression === lvl ? 'active' : ''}`}
                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase' }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: FAVORITES MANAGEMENT (Full Control) */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} style={{ color: 'var(--accent-warning)' }} fill="var(--accent-warning)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Starred Favorite Tools ({favoriteTools.length})
            </span>
          </div>

          {favoriteTools.length > 0 && (
            <button
              onClick={handleClearFavorites}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-error)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {favoriteTools.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            No favorite tools pinned. Star tools in the Catalog to show them here and on Home.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {favoriteTools.map((t) => (
              <div
                key={`settings_fav_${t.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                <button
                  onClick={() => handleRemoveFavoriteItem(t.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-error)', cursor: 'pointer' }}
                  title="Unstar favorite tool"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: STORAGE & DATA MANAGEMENT */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Storage & Data Management
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>History Items Stored:</span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{historyCount} items</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={handleClearHistory}
            disabled={historyCount === 0}
            style={{ justifyContent: 'center', color: 'var(--accent-error)', borderColor: 'var(--border-color)' }}
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>

          <button
            className="btn-secondary"
            onClick={handleResetDefaults}
            style={{ justifyContent: 'center' }}
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* SECTION 6: PRIVACY GUARANTEE */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
        }}
      >
        <Shield size={24} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            100% On-Device Processing
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
            All media, documents, images, audio, and videos are rendered directly within your web browser using HTML5 Canvas & WebAssembly. Zero files are uploaded to cloud servers.
          </div>
        </div>
      </div>

      {/* SECTION 7: ABOUT ENGINE INFO */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
        }}
      >
        <Info size={24} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            N-Lab React Engine Info
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Version: 2.1.1 • Built with Vite, React 18 & TypeScript
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
