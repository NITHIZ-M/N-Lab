import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Image, FileText, Music, Video, FolderCheck, List } from 'lucide-react';
import { ToolRow } from '../components/common/ToolRow';
import { ALL_TOOLS } from '../data/toolRegistry';
import { StorageService } from '../services/storageService';
import { ToolFamily, ToolDefinition } from '../types';

interface ToolCategorySection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  family: ToolFamily;
  tools: ToolDefinition[];
}

export const ToolsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<ToolFamily | 'FAVORITES' | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'CATEGORIZED' | 'COMPACT'>('CATEGORIZED');

  useEffect(() => {
    setFavorites(StorageService.getFavorites());
  }, []);

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = StorageService.toggleFavorite(id);
    setFavorites(updated);
  };

  const favoriteToolsList = ALL_TOOLS.filter((t) => favorites.includes(t.id));

  // Global Filter logic for COMPACT / flat list view
  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFamily === 'FAVORITES') {
      return matchesSearch && favorites.includes(tool.id);
    }
    const matchesFamily = selectedFamily === null || tool.family === selectedFamily;
    return matchesSearch && matchesFamily;
  });

  // Category Sections setup with dynamic tool filtering
  const allCategorySections: ToolCategorySection[] = [
    {
      id: 'image',
      title: 'Image & Graphic Studio',
      subtitle: 'Crop, resize, compress, convert & enhance photo assets',
      icon: <Image size={20} />,
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.12)',
      family: ToolFamily.IMAGE,
      tools: ALL_TOOLS.filter((t) => t.family === ToolFamily.IMAGE),
    },
    {
      id: 'pdf',
      title: 'PDF Document Studio',
      subtitle: 'Merge, split, watermark, protect & extract text from PDFs',
      icon: <FileText size={20} />,
      color: '#A855F7',
      bgColor: 'rgba(168, 85, 247, 0.12)',
      family: ToolFamily.PDF,
      tools: ALL_TOOLS.filter((t) => t.family === ToolFamily.PDF),
    },
    {
      id: 'audio',
      title: 'Audio & Sound Lab',
      subtitle: 'Trim waveform, boost volume, EQ filters, TTS & extract sound',
      icon: <Music size={20} />,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      family: ToolFamily.AUDIO,
      tools: ALL_TOOLS.filter((t) => t.family === ToolFamily.AUDIO),
    },
    {
      id: 'video',
      title: 'Video & Motion Studio',
      subtitle: 'Trim clips, merge videos, crop, speed adjustment & animated GIF',
      icon: <Video size={20} />,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      family: ToolFamily.VIDEO,
      tools: ALL_TOOLS.filter((t) => t.family === ToolFamily.VIDEO),
    },
  ];

  // Dynamically computed sections based on searchQuery & selectedFamily
  const visibleCategorySections = allCategorySections
    .map((sec) => {
      if (selectedFamily && selectedFamily !== 'FAVORITES' && sec.family !== selectedFamily) {
        return null;
      }
      const tools = sec.tools.filter((tool) => {
        const matchesSearch =
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.category.toLowerCase().includes(searchQuery.toLowerCase());
        if (selectedFamily === 'FAVORITES') {
          return matchesSearch && favorites.includes(tool.id);
        }
        return matchesSearch;
      });
      return { ...sec, tools };
    })
    .filter((sec): sec is ToolCategorySection => sec !== null && sec.tools.length > 0);

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      {/* Top Header & View Toggle (Sections vs List) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Media & Doc Tools
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {ALL_TOOLS.length} client-side offline tools available
          </p>
        </div>

        {/* View Switcher Controls */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-tertiary)',
            padding: '4px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setViewMode('CATEGORIZED')}
            style={{
              border: 'none',
              background: viewMode === 'CATEGORIZED' ? 'var(--surface-card)' : 'transparent',
              color: viewMode === 'CATEGORIZED' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: viewMode === 'CATEGORIZED' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <FolderCheck size={14} />
            <span>Sections</span>
          </button>
          <button
            onClick={() => setViewMode('COMPACT')}
            style={{
              border: 'none',
              background: viewMode === 'COMPACT' ? 'var(--surface-card)' : 'transparent',
              color: viewMode === 'COMPACT' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: viewMode === 'COMPACT' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <List size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="search-box">
        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          className="search-input"
          placeholder="Search tools by name, format or action…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Chips Scrollbar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setSelectedFamily(null)}
          className={`segmented-option ${selectedFamily === null ? 'active' : ''}`}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', minWidth: 'auto', whiteSpace: 'nowrap' }}
        >
          ALL ({ALL_TOOLS.length})
        </button>
        <button
          onClick={() => setSelectedFamily('FAVORITES')}
          className={`segmented-option ${selectedFamily === 'FAVORITES' ? 'active' : ''}`}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: selectedFamily === 'FAVORITES' ? 'var(--accent-warning)' : undefined,
          }}
        >
          <Star size={13} fill={selectedFamily === 'FAVORITES' ? 'var(--accent-warning)' : 'none'} />
          <span>FAVORITES ({favoriteToolsList.length})</span>
        </button>
        {Object.values(ToolFamily).map((fam) => {
          const count = ALL_TOOLS.filter((t) => t.family === fam).length;
          return (
            <button
              key={fam}
              onClick={() => setSelectedFamily(fam)}
              className={`segmented-option ${selectedFamily === fam ? 'active' : ''}`}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', minWidth: 'auto', whiteSpace: 'nowrap' }}
            >
              {fam} ({count})
            </button>
          );
        })}
      </div>

      {/* Starred Favorites Quick Access (If non-empty and no narrow filter) */}
      {favoriteToolsList.length > 0 && !selectedFamily && !searchQuery && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Star size={18} fill="var(--accent-warning)" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Starred Favorites
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Your pinned quick-access media tools ({favoriteToolsList.length})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {favoriteToolsList.map((tool) => (
              <ToolRow
                key={`fav_${tool.id}`}
                title={tool.name}
                description={tool.description}
                category={tool.category}
                iconName={tool.iconName}
                isFavorite={true}
                onFavoriteToggle={(e) => handleToggleFavorite(tool.id, e)}
                onClick={() => navigate(`/workspace/${tool.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTIONS MODE */}
      {viewMode === 'CATEGORIZED' ? (
        visibleCategorySections.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            No tools matching "{searchQuery || selectedFamily}"
          </div>
        ) : (
          visibleCategorySections.map((sec) => (
            <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {/* CATEGORY HEADER BAR WITH PERFECT BADGE ALIGNMENT */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${sec.color}`,
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-md)',
                      background: sec.bgColor,
                      color: sec.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {sec.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                      }}
                    >
                      {sec.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {sec.subtitle}
                    </p>
                  </div>
                </div>

                {/* PERFECTLY ALIGNED TOOL COUNT BADGE PILL */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '0 10px',
                    height: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-pill)',
                    background: sec.bgColor,
                    color: sec.color,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                  }}
                >
                  {sec.tools.length} TOOLS
                </span>
              </div>

              {/* Category Tool Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sec.tools.map((tool) => (
                  <ToolRow
                    key={tool.id}
                    title={tool.name}
                    description={tool.description}
                    category={tool.category}
                    iconName={tool.iconName}
                    isFavorite={favorites.includes(tool.id)}
                    onFavoriteToggle={(e) => handleToggleFavorite(tool.id, e)}
                    onClick={() => navigate(`/workspace/${tool.id}`)}
                  />
                ))}
              </div>
            </div>
          ))
        )
      ) : (
        /* COMPACT / LIST MODE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTools.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              No tools matching "{searchQuery || selectedFamily}"
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
                onFavoriteToggle={(e) => handleToggleFavorite(tool.id, e)}
                onClick={() => navigate(`/workspace/${tool.id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ToolsScreen;


