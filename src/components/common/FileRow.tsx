import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';

interface FileRowProps {
  fileName: string;
  toolName: string;
  fileSizeFormatted: string;
  dateFormatted?: string;
  downloadUrl?: string;
  onDelete?: () => void;
}

export const FileRow: React.FC<FileRowProps> = ({
  fileName,
  toolName,
  fileSizeFormatted,
  dateFormatted = 'Recent',
  downloadUrl,
  onDelete,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        margin: '6px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary-container)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileText size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {fileName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{toolName}</span> • {fileSizeFormatted} • {dateFormatted}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={fileName}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '11px', textDecoration: 'none' }}
          >
            <Download size={14} />
            <span>SAVE</span>
          </a>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
