import React, { useState, useEffect } from 'react';
import { FileRow } from '../components/common/FileRow';
import { StorageService } from '../services/storageService';
import { HistoryItem } from '../types';
import { Trash2, History as HistoryIcon } from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(StorageService.getHistory());
  }, []);

  const handleClearAll = () => {
    StorageService.clearHistory();
    setHistory([]);
  };

  const handleDeleteItem = (id: string) => {
    const updated = StorageService.deleteHistoryItem(id);
    setHistory(updated);
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Operation History
        </h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-error)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Trash2 size={14} />
            <span>CLEAR ALL</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            background: 'var(--surface-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
          }}
        >
          <HistoryIcon size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>History clipboard empty</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Processed files will appear here for easy download access</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map((item) => (
            <FileRow
              key={item.id}
              fileName={item.fileName}
              toolName={item.toolName}
              fileSizeFormatted={item.fileSizeFormatted}
              dateFormatted={new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              downloadUrl={item.outputBlobUrl}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
