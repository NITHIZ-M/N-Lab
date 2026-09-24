import React from 'react';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionText, onActionClick }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 10px 0' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
        {title}
      </h3>
      {actionText && (
        <button
          onClick={onActionClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '0.8px',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
