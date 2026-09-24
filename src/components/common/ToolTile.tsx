import React from 'react';
import * as Icons from 'lucide-react';
import { CATEGORY_INFO } from '../../data/toolRegistry';
import { ToolCategory } from '../../types';

interface ToolTileProps {
  title: string;
  category: ToolCategory;
  iconName: string;
  onClick: () => void;
}

export const ToolTile: React.FC<ToolTileProps> = ({ title, category, iconName, onClick }) => {
  const catInfo = CATEGORY_INFO[category] || CATEGORY_INFO[ToolCategory.CONVERT];
  const IconComponent = (Icons as any)[iconName] || Icons.Wrench;

  return (
    <div className="tool-tile" onClick={onClick}>
      <div className="tile-icon-box" style={{ background: catInfo.badgeBg, color: catInfo.textColor }}>
        <IconComponent size={22} />
      </div>
      <div>
        <div style={{ fontSize: '9px', fontWeight: 800, color: catInfo.textColor, letterSpacing: '0.8px', marginBottom: '2px' }}>
          {category}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {title}
        </div>
      </div>
    </div>
  );
};
