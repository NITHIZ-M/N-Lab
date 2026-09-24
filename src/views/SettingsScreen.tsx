import React from 'react';
import { StorageService } from '../services/storageService';
import { UserPreferences } from '../types';
import { Sun, Moon, Shield, Info, HardDrive } from 'lucide-react';

interface SettingsScreenProps {
  prefs: UserPreferences;
  onUpdatePrefs: (updated: Partial<UserPreferences>) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ prefs, onUpdatePrefs }) => {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        Preferences & Engine
      </h2>

      {/* Theme Selection */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Interface Theme Mode
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button
            className={`btn-secondary ${prefs.themeMode === 'dark' ? 'active' : ''}`}
            onClick={() => onUpdatePrefs({ themeMode: 'dark' })}
            style={{
              justifyContent: 'center',
              borderColor: prefs.themeMode === 'dark' ? 'var(--accent-primary)' : 'var(--border-color)',
              background: prefs.themeMode === 'dark' ? 'var(--accent-primary-container)' : 'var(--bg-secondary)',
              color: prefs.themeMode === 'dark' ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            <Moon size={16} />
            <span>Dark Theme</span>
          </button>
          <button
            className={`btn-secondary ${prefs.themeMode === 'light' ? 'active' : ''}`}
            onClick={() => onUpdatePrefs({ themeMode: 'light' })}
            style={{
              justifyContent: 'center',
              borderColor: prefs.themeMode === 'light' ? 'var(--accent-primary)' : 'var(--border-color)',
              background: prefs.themeMode === 'light' ? 'var(--accent-primary-container)' : 'var(--bg-secondary)',
              color: prefs.themeMode === 'light' ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            <Sun size={16} />
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      {/* Compression Settings */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Image Compression Quality ({prefs.compressionQuality}%)
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

      {/* Privacy Guarantee */}
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

      {/* About Engine Info */}
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
            Version: 2.0.1 • Built with Vite, React 18 & TypeScript
          </div>
        </div>
      </div>
    </div>
  );
};
