import React, { useRef } from 'react';
import { UploadCloud, FilePlus } from 'lucide-react';

interface HeroCardProps {
  title: string;
  caption: string;
  onFileSelect: (files: FileList) => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ title, caption, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="hero-card"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="hero-card-glow" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        multiple
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, position: 'relative' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', opacity: 0.9, textTransform: 'uppercase' }}>
            {caption}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>
            {title}
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px', fontWeight: 500 }}>
            Drag & drop files here or click to browse
          </p>
        </div>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <UploadCloud size={28} />
        </div>
      </div>
    </div>
  );
};
