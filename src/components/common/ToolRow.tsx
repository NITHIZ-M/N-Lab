import React from 'react';
import * as Icons from 'lucide-react';
import { CATEGORY_INFO } from '../../data/toolRegistry';
import { ToolCategory } from '../../types';

interface ToolRowProps {
  title: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const ToolRow: React.FC<ToolRowProps> = ({
  title,
  description,
  category,
  iconName,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
}) => {
  const catInfo = CATEGORY_INFO[category] || CATEGORY_INFO[ToolCategory.CONVERT];
  const IconComponent = (Icons as any)[iconName] || Icons.Wrench;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: catInfo.badgeBg,
            color: catInfo.textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComponent size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 'var(--radius-pill)',
                background: catInfo.badgeBg,
                color: catInfo.textColor,
                letterSpacing: '0.6px',
              }}
            >
              {category}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
            {description}
          </p>
        </div>
      </div>

      {onFavoriteToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(e);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: isFavorite ? 'var(--accent-warning)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <Icons.Star size={18} fill={isFavorite ? 'var(--accent-warning)' : 'none'} />
        </button>
      )}
    </div>
  );
};
