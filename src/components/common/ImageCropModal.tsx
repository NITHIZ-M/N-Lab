import React, { useState, useEffect, useRef } from 'react';
import { X, Check, RotateCw, RefreshCw, Crop } from 'lucide-react';

interface ImageCropModalProps {
  file: File;
  onApplyCrop: (croppedFile: File) => void;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ file, onApplyCrop, onClose }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);

  // Aspect ratio presets: 'FREE', '1:1', '4:3', '16:9', '9:16'
  const [aspectRatio, setAspectRatio] = useState<string>('FREE');

  // Crop box in relative percentages [0..100] relative to rendered image
  const [cropBox, setCropBox] = useState({ x: 5, y: 5, width: 90, height: 90 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBox, setInitialBox] = useState({ x: 5, y: 5, width: 90, height: 90 });

  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!active) return;
      const src = e.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => {
        if (active) setImageObj(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    return () => {
      active = false;
    };
  }, [file]);

  // Adjust crop box when aspect ratio changes
  useEffect(() => {
    if (aspectRatio === 'FREE') return;
    let ratio = 1;
    if (aspectRatio === '1:1') ratio = 1;
    if (aspectRatio === '4:3') ratio = 4 / 3;
    if (aspectRatio === '16:9') ratio = 16 / 9;
    if (aspectRatio === '9:16') ratio = 9 / 16;

    let newWidth = 80;
    let newHeight = newWidth / ratio;
    if (newHeight > 80) {
      newHeight = 80;
      newWidth = newHeight * ratio;
    }
    setCropBox({
      x: Math.max(2, 50 - newWidth / 2),
      y: Math.max(2, 50 - newHeight / 2),
      width: newWidth,
      height: newHeight,
    });
  }, [aspectRatio]);

  // Pointer Down (Mouse & Touch)
  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBox({ ...cropBox });
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    let { x, y, width, height } = initialBox;

    if (dragHandle === 'MOVE') {
      x = Math.max(0, Math.min(100 - width, initialBox.x + deltaX));
      y = Math.max(0, Math.min(100 - height, initialBox.y + deltaY));
    } else if (dragHandle === 'NW') {
      const newX = Math.max(0, Math.min(initialBox.x + initialBox.width - 5, initialBox.x + deltaX));
      const newY = Math.max(0, Math.min(initialBox.y + initialBox.height - 5, initialBox.y + deltaY));
      width = initialBox.x + initialBox.width - newX;
      height = initialBox.y + initialBox.height - newY;
      x = newX;
      y = newY;
    } else if (dragHandle === 'NE') {
      width = Math.max(5, Math.min(100 - initialBox.x, initialBox.width + deltaX));
      const newY = Math.max(0, Math.min(initialBox.y + initialBox.height - 5, initialBox.y + deltaY));
      height = initialBox.y + initialBox.height - newY;
      y = newY;
    } else if (dragHandle === 'SW') {
      const newX = Math.max(0, Math.min(initialBox.x + initialBox.width - 5, initialBox.x + deltaX));
      width = initialBox.x + initialBox.width - newX;
      height = Math.max(5, Math.min(100 - initialBox.y, initialBox.height + deltaY));
      x = newX;
    } else if (dragHandle === 'SE') {
      width = Math.max(5, Math.min(100 - initialBox.x, initialBox.width + deltaX));
      height = Math.max(5, Math.min(100 - initialBox.y, initialBox.height + deltaY));
    }

    setCropBox({ x, y, width, height });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
    setDragHandle(null);
  };

  const handleApply = () => {
    if (!imageObj) return;

    const sourceX = Math.max(0, Math.floor((cropBox.x / 100) * imageObj.naturalWidth));
    const sourceY = Math.max(0, Math.floor((cropBox.y / 100) * imageObj.naturalHeight));
    const sourceW = Math.min(imageObj.naturalWidth - sourceX, Math.floor((cropBox.width / 100) * imageObj.naturalWidth));
    const sourceH = Math.min(imageObj.naturalHeight - sourceY, Math.floor((cropBox.height / 100) * imageObj.naturalHeight));

    if (sourceW <= 0 || sourceH <= 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (rotation === 90 || rotation === 270) {
      canvas.width = sourceH;
      canvas.height = sourceW;
    } else {
      canvas.width = sourceW;
      canvas.height = sourceH;
    }

    ctx.save();
    if (rotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else if (rotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
    } else if (rotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
    }

    ctx.drawImage(
      imageObj,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      sourceW,
      sourceH
    );
    ctx.restore();

    const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(outputMime, 0.95);
    
    // Helper to convert Data URL to File
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const croppedFile = new File([u8arr], file.name || 'cropped.jpg', {
      type: outputMime,
      lastModified: Date.now(),
    });

    onApplyCrop(croppedFile);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        maxHeight: '100dvh',
        zIndex: 1000,
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      className="animate-fade-in"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(10px + var(--safe-top)) 16px 10px 16px',
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Crop size={20} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '15px', fontWeight: 800 }}>FREEHAND IMAGE CROPPER</span>
        </div>
        <button
          onClick={onClose}
          data-close-modal="true"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Workspace (Takes fixed constrained 52vh portion of viewport) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: '52vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          overflow: 'hidden',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {imageSrc ? (
          <div
            ref={wrapperRef}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '100%',
              maxHeight: '52vh',
            }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop Target"
              style={{
                maxWidth: '100%',
                maxHeight: '52vh',
                objectFit: 'contain',
                display: 'block',
                transform: `rotate(${rotation}deg)`,
                pointerEvents: 'none',
                borderRadius: 'var(--radius-sm)',
              }}
            />

            {/* Draggable Freehand Crop Box */}
            <div
              style={{
                position: 'absolute',
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
                border: '2px solid var(--accent-secondary)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                cursor: 'move',
                touchAction: 'none',
              }}
              onPointerDown={(e) => handlePointerDown('MOVE', e)}
            >
              {/* 3x3 Grid Overlay */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)' }} />
                <div />
              </div>

              {/* Corner Drag Handles */}
              <div
                style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '-14px',
                  width: '30px',
                  height: '30px',
                  background: 'var(--accent-secondary)',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  touchAction: 'none',
                  border: '2px solid #ffffff',
                }}
                onPointerDown={(e) => handlePointerDown('NW', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '-14px',
                  width: '30px',
                  height: '30px',
                  background: 'var(--accent-secondary)',
                  borderRadius: '50%',
                  cursor: 'nesw-resize',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  touchAction: 'none',
                  border: '2px solid #ffffff',
                }}
                onPointerDown={(e) => handlePointerDown('NE', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-14px',
                  left: '-14px',
                  width: '30px',
                  height: '30px',
                  background: 'var(--accent-secondary)',
                  borderRadius: '50%',
                  cursor: 'nesw-resize',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  touchAction: 'none',
                  border: '2px solid #ffffff',
                }}
                onPointerDown={(e) => handlePointerDown('SW', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-14px',
                  right: '-14px',
                  width: '30px',
                  height: '30px',
                  background: 'var(--accent-secondary)',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  touchAction: 'none',
                  border: '2px solid #ffffff',
                }}
                onPointerDown={(e) => handlePointerDown('SE', e)}
              />
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading Image...</div>
        )}
      </div>

      {/* Preset Toolbar & Fixed Action Buttons Footer */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 16px calc(10px + var(--safe-bottom)) 16px',
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', overflowX: 'auto' }}>
          {['FREE', '1:1', '4:3', '16:9', '9:16'].map((preset) => (
            <button
              key={preset}
              className={`segmented-option ${aspectRatio === preset ? 'active' : ''}`}
              onClick={() => setAspectRatio(preset)}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                color: aspectRatio === preset ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: aspectRatio === preset ? 'var(--accent-primary-container)' : 'transparent',
                border: aspectRatio === preset ? '1px solid var(--accent-primary)' : '1px solid transparent',
              }}
            >
              {preset}
            </button>
          ))}

          <button
            className="btn-secondary"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            style={{ padding: '6px 12px', fontSize: '11px' }}
            title="Rotate 90°"
          >
            <RotateCw size={14} />
            <span>90°</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => setCropBox({ x: 5, y: 5, width: 90, height: 90 })}
            style={{ justifyContent: 'center', padding: '10px' }}
          >
            <RefreshCw size={16} />
            <span>RESET CROP</span>
          </button>

          <button className="btn-primary" onClick={handleApply} style={{ justifyContent: 'center', padding: '10px' }}>
            <Check size={18} />
            <span>APPLY CROP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

