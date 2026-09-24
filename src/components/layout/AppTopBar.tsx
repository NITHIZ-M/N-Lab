import React from 'react';
import { Sun, Moon, ShieldCheck } from 'lucide-react';

interface AppTopBarProps {
  themeMode: string;
  onToggleTheme: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({ themeMode, onToggleTheme }) => {
  return (
    <header className="top-bar">
      <div className="brand-section">
        <img
          src="/App_Logo.jpg"
          alt="N-Lab Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            border: '1px solid var(--border-color)',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="brand-title">N-Lab</span>
            <span className="brand-subtitle">v2.0.1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <ShieldCheck size={12} style={{ color: 'var(--accent-success)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>100% PRIVATE ENGINE</span>
          </div>
        </div>
      </div>

      <button
        onClick={onToggleTheme}
        className="theme-toggle-btn"
        title="Toggle Theme Mode"
        aria-label="Toggle Dark/Light Mode"
      >
        {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
};
