import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { ToolRow } from '../components/common/ToolRow';
import { SectionHeader } from '../components/common/SectionHeader';
import { ALL_TOOLS } from '../data/toolRegistry';
import { ToolFamily } from '../types';

export const ToolsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<ToolFamily | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = selectedFamily === null || tool.family === selectedFamily;
    return matchesSearch && matchesFamily;
  });

  const families = Object.values(ToolFamily);

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-in">
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        All Tools Catalog
      </h2>

      {/* Search Input */}
      <div className="search-box">
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="search-input"
          placeholder="Search 20+ media & document tools…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Family Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setSelectedFamily(null)}
          className={`segmented-option ${selectedFamily === null ? 'active' : ''}`}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', minWidth: 'auto' }}
        >
          ALL
        </button>
        {families.map((fam) => (
          <button
            key={fam}
            onClick={() => setSelectedFamily(fam)}
            className={`segmented-option ${selectedFamily === fam ? 'active' : ''}`}
            style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', minWidth: 'auto' }}
          >
            {fam}
          </button>
        ))}
      </div>

      {/* Tools List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No tools matching "{searchQuery}"
          </div>
        ) : (
          filteredTools.map((tool) => (
            <ToolRow
              key={tool.id}
              title={tool.name}
              description={tool.description}
              category={tool.category}
              iconName={tool.iconName}
              isFavorite={favorites.includes(tool.id)}
              onFavoriteToggle={() => toggleFavorite(tool.id)}
              onClick={() => navigate(`/workspace/${tool.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};
