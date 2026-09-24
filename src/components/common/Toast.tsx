import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) setTimeout(onClose, 250);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, duration, onClose]);

  if (!message && !visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: 'var(--accent-error)', flexShrink: 0 }} />;
      default:
        return <Sparkles size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(16px + var(--safe-top))',
        left: '50%',
        transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, -20px)',
        opacity: visible ? 1 : 0,
        zIndex: 10000,
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-pill)',
        padding: '10px 16px',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
        fontSize: '12px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        boxSizing: 'border-box',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {getIcon()}
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
