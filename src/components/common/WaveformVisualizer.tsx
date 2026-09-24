import React, { useEffect, useRef, useState } from 'react';

interface WaveformVisualizerProps {
  file: File;
  startTime: number;
  endTime: number;
  onRangeChange: (start: number, end: number) => void;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  file,
  startTime,
  endTime,
  onRangeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;
    const loadAudio = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        if (!isCancelled) {
          setAudioBuffer(decoded);
          setDuration(decoded.duration);
          if (endTime === 0 || endTime > decoded.duration) {
            onRangeChange(0, decoded.duration);
          }
        }
      } catch (err) {
        console.error('Failed to decode audio waveform:', err);
      }
    };

    loadAudio();
    return () => {
      isCancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // Draw waveform bars
    ctx.fillStyle = '#6366F1';
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = (1 + min) * amp;
      const y2 = (1 + max) * amp;
      const barHeight = Math.max(2, y2 - y1);

      const isSelected =
        duration > 0 &&
        i / width >= startTime / duration &&
        i / width <= endTime / duration;

      ctx.fillStyle = isSelected ? '#38BDF8' : 'rgba(148, 163, 184, 0.3)';
      ctx.fillRect(i, y1, 2, barHeight);
    }

    // Draw trim overlays
    if (duration > 0) {
      const startX = (startTime / duration) * width;
      const endX = (endTime / duration) * width;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);

      // Start Handle
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(startX - 2, 0, 4, height);

      // End Handle
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(endX - 2, 0, 4, height);
    }
  }, [audioBuffer, startTime, endTime, duration]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
        <span>START: {startTime.toFixed(1)}s</span>
        <span>DURATION: {duration.toFixed(1)}s</span>
        <span>END: {endTime.toFixed(1)}s</span>
      </div>
      <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={80}
          style={{ width: '100%', height: '80px', display: 'block', cursor: 'crosshair' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
            START CUT (SEC)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max={endTime}
            value={startTime}
            onChange={(e) => onRangeChange(Math.max(0, parseFloat(e.target.value) || 0), endTime)}
            className="search-input"
            style={{ background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
            END CUT (SEC)
          </label>
          <input
            type="number"
            step="0.5"
            min={startTime}
            max={duration || 1000}
            value={endTime}
            onChange={(e) => onRangeChange(startTime, Math.min(duration || 1000, parseFloat(e.target.value) || 0))}
            className="search-input"
            style={{ background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      </div>
    </div>
  );
};
