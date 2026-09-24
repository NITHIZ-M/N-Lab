import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroCard } from '../components/common/HeroCard';
import { SectionHeader } from '../components/common/SectionHeader';
import { ToolTile } from '../components/common/ToolTile';
import { FileRow } from '../components/common/FileRow';
import { ALL_TOOLS } from '../data/toolRegistry';
import { StorageService } from '../services/storageService';
import { HistoryItem } from '../types';
import { ArrowRight, Inbox, Sparkles, Cpu } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(StorageService.getHistory());
  }, []);

  const pinnedTools = ALL_TOOLS.filter((t) => t.isPinnedToHome);

  const handleFileSelect = (files: FileList) => {
    if (files.length > 0) {
      // Direct user to Image to PDF or generic workspace with uploaded file
      navigate('/workspace/img_pdf', { state: { initialFiles: Array.from(files) } });
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      <HeroCard
        title="Select & Process File"
        caption="TAP OR DROP MEDIA / DOC FILES HERE"
        onFileSelect={handleFileSelect}
      />

      {/* Engine Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '1px' }}>
              CLIENT ENGINE STATUS
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {history.length === 0 ? 'Engine Idle • Ready for Operations' : `${history.length} Operations Processed`}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            padding: '4px 8px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--accent-primary-container)',
            color: 'var(--accent-primary)',
            letterSpacing: '0.8px',
          }}
        >
          100% PRIVATE
        </span>
      </div>

      {/* Recent History Clipboard */}
      <div>
        <SectionHeader
          title="History Clipboard"
          actionText={history.length > 0 ? 'VIEW ALL' : undefined}
          onActionClick={() => navigate('/history')}
        />

        {history.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: 'var(--surface-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <Inbox size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
            <div style={{ fontSize: '13px', fontWeight: 600 }}>No recent activity recorded</div>
          </div>
        ) : (
          history.slice(0, 3).map((item) => (
            <FileRow
              key={item.id}
              fileName={item.fileName}
              toolName={item.toolName}
              fileSizeFormatted={item.fileSizeFormatted}
              downloadUrl={item.outputBlobUrl}
            />
          ))
        )}
      </div>

      {/* Pinned Core Tools Grid */}
      <div>
        <SectionHeader title="Core Engines" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          {pinnedTools.map((tool) => (
            <ToolTile
              key={tool.id}
              title={tool.name}
              category={tool.category}
              iconName={tool.iconName}
              onClick={() => navigate(`/workspace/${tool.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Catalog Banner Link */}
      <div
        onClick={() => navigate('/tools')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--accent-primary-container)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-primary)' }}>
            More Media Engines
          </div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '2px' }}>
            FULL CATALOG • 20+ CLIENT-SIDE TOOLS
          </div>
        </div>
        <ArrowRight size={22} style={{ color: 'var(--accent-primary)' }} />
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>
        N-LAB V2.0.1 • REACT CLIENT-SIDE ENGINE
      </div>
    </div>
  );
};
