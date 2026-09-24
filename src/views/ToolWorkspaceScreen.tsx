import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getToolById } from '../data/toolRegistry';
import { ImageProcessor } from '../services/mediaEngine/imageProcessor';
import { PdfProcessor } from '../services/mediaEngine/pdfProcessor';
import { AudioProcessor } from '../services/mediaEngine/audioProcessor';
import { VideoProcessor } from '../services/mediaEngine/videoProcessor';
import { DocProcessor } from '../services/mediaEngine/docProcessor';
import { StorageService } from '../services/storageService';
import { DownloadService } from '../services/downloadService';
import { StandardToolOutput, ToolFamily } from '../types';
import { SegmentedControl } from '../components/common/SegmentedControl';
import { WaveformVisualizer } from '../components/common/WaveformVisualizer';
import { ImageCropModal } from '../components/common/ImageCropModal';
import { Toast } from '../components/common/Toast';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  Download,
  RefreshCw,
  AlertCircle,
  Copy,
  Eye,
  Sliders,
  Share2,
  Maximize2,
  X,
  Trash2,
  Sparkles,
  Crop,
  ChevronUp,
  ChevronDown,
  PlusCircle,
} from 'lucide-react';

enum Step {
  CONFIGURE,
  PROCESSING,
  RESULT,
}

const FileThumbnailItem: React.FC<{ file: File; onClickPreview?: () => void }> = ({ file, onClickPreview }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (active && e.target?.result) {
          setSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setSrc(null);
    }
    return () => {
      active = false;
    };
  }, [file]);

  if (src) {
    return (
      <img
        src={src}
        alt={file.name}
        onClick={onClickPreview}
        title="Tap to preview image"
        style={{
          width: '44px',
          height: '44px',
          objectFit: 'cover',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
          cursor: onClickPreview ? 'pointer' : 'default',
        }}
      />
    );
  }
  return <FileText size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />;
};

export const ToolWorkspaceScreen: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const tool = getToolById(toolId || 'img_pdf');

  const [files, setFiles] = useState<File[]>([]);
  const [outputFileName, setOutputFileName] = useState(`nlab_${toolId || 'output'}_${Math.floor(Date.now() / 1000)}`);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Freehand Crop Modal state
  const [croppingFileIndex, setCroppingFileIndex] = useState<number | null>(null);

  // Parameter states
  const [orientation, setOrientation] = useState('PORTRAIT');
  const [margin, setMargin] = useState('NONE');
  const [watermarkText, setWatermarkText] = useState('N-LAB PRIVACY');
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('png');
  const [volume, setVolume] = useState(150);
  const [speed, setSpeed] = useState(1.25);
  const [degrees, setDegrees] = useState(90);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);
  const [eqPreset, setEqPreset] = useState('BASS_BOOST');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [ttsText, setTtsText] = useState('Welcome to N-Lab Studio offline media toolkit.');
  const [copiedText, setCopiedText] = useState(false);

  const [step, setStep] = useState<Step>(Step.CONFIGURE);
  const [progressPct, setProgressPct] = useState(0);
  const [progressStepText, setProgressStepText] = useState('');
  const [outputResult, setOutputResult] = useState<StandardToolOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && (location.state as any).initialFiles) {
      const initial = (location.state as any).initialFiles as File[];
      setFiles(initial);
      if (initial.length > 0) {
        createPreviewUrl(initial[0]);
      }
    }
  }, [location.state, toolId]);

  // Handle hardware back button custom event
  useEffect(() => {
    const handleBackButtonEvent = (e: Event) => {
      if (croppingFileIndex !== null) {
        setCroppingFileIndex(null);
        e.preventDefault();
      } else if (showFullPreviewModal) {
        setShowFullPreviewModal(false);
        e.preventDefault();
      } else if (step === Step.RESULT || step === Step.PROCESSING) {
        setStep(Step.CONFIGURE);
        e.preventDefault();
      }
    };

    window.addEventListener('nlab-back-button', handleBackButtonEvent);
    return () => {
      window.removeEventListener('nlab-back-button', handleBackButtonEvent);
    };
  }, [croppingFileIndex, showFullPreviewModal, step]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const createPreviewUrl = (file: File) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleBackNavigation = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/tools');
    }
  };

  if (!tool) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Tool non-existent or moved.{' '}
        <button onClick={() => navigate('/tools')} className="btn-secondary" style={{ marginTop: '12px' }}>
          Go to Tools
        </button>
      </div>
    );
  }

  // Continuous Multi-File Picking (Appends to existing file list)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => {
        const updated = [...prev, ...newFiles];
        if (updated.length > 0) createPreviewUrl(updated[0]);
        return updated;
      });
      e.target.value = '';
    }
  };


  const handlePreviewInputFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFilePreviewUrl(e.target.result as string);
        setShowFullPreviewModal(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        createPreviewUrl(updated[0]);
      } else {
        setFilePreviewUrl(null);
      }
      return updated;
    });
  };

  const handleMoveFile = (index: number, direction: 'UP' | 'DOWN') => {
    setFiles((prev) => {
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      createPreviewUrl(updated[0]);
      return updated;
    });
  };

  // Crop Applied Callback
  const handleApplyCroppedImage = (croppedFile: File) => {
    if (croppingFileIndex !== null) {
      setFiles((prev) => {
        const updated = [...prev];
        updated[croppingFileIndex] = croppedFile;
        createPreviewUrl(updated[0]);
        return updated;
      });
      showToast(`Image ${croppingFileIndex + 1} cropped successfully!`);
    }
  };

  const handleSaveOutput = async () => {
    if (!outputResult) return;
    showToast('Saving directly to Downloads/Documents folder...');
    const result = await DownloadService.saveFile(outputResult.blob, outputResult.outputFileName);
    showToast(result.message);
  };

  const handleShareOutput = async () => {
    if (!outputResult) return;
    showToast('Opening system share dialog...');
    const result = await DownloadService.shareFile(outputResult.blob, outputResult.outputFileName);
    showToast(result.message);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast('Extracted text copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleStartProcessing = async () => {
    if (tool.id !== 'audio_tts' && files.length === 0) return;

    setStep(Step.PROCESSING);
    setProgressPct(5);
    setProgressStepText(`Initializing ${tool.name}...`);
    setErrorMessage(null);

    const inputData = {
      toolId: tool.id,
      files,
      outputFileName,
      params: {
        orientation,
        margin,
        watermarkText,
        quality,
        format,
        volume,
        speed,
        degrees,
        width,
        height,
        startTime,
        duration: Math.max(1, endTime - startTime),
        startPage,
        endPage,
        eqPreset,
        aspectRatio,
        textPrompt: ttsText,
      },
    };

    try {
      let result: StandardToolOutput;

      if (tool.id.startsWith('doc_')) {
        result = await DocProcessor.process(inputData, (pct, text) => {
          setProgressPct(pct);
          setProgressStepText(text);
        });
      } else if (tool.family === ToolFamily.IMAGE) {
        result = await ImageProcessor.process(inputData, (pct, text) => {
          setProgressPct(pct);
          setProgressStepText(text);
        });
      } else if (tool.family === ToolFamily.PDF) {
        result = await PdfProcessor.process(inputData, (pct, text) => {
          setProgressPct(pct);
          setProgressStepText(text);
        });
      } else if (tool.family === ToolFamily.AUDIO) {
        result = await AudioProcessor.process(inputData, (pct, text) => {
          setProgressPct(pct);
          setProgressStepText(text);
        });
      } else {
        result = await VideoProcessor.process(inputData, (pct, text) => {
          setProgressPct(pct);
          setProgressStepText(text);
        });
      }

      setOutputResult(result);
      setStep(Step.RESULT);

      StorageService.addHistoryItem({
        fileName: result.outputFileName,
        toolId: tool.id,
        toolName: tool.name,
        familyName: tool.family,
        fileSizeBytes: result.fileSizeBytes,
        fileSizeFormatted: result.fileSizeFormatted,
        outputBlobUrl: result.downloadUrl,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Processing failed. Please verify inputs and try again.');
      setStep(Step.CONFIGURE);
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      {/* Toast Feedback Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Safe Non-Looping Workspace Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBackNavigation}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-pill)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
            title="Back to Catalog"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {tool.name}
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tool.description}</p>
          </div>
        </div>

        {/* Quick Clear All when files exist */}
        {files.length > 0 && step === Step.CONFIGURE && (
          <button
            className="btn-secondary"
            onClick={() => {
              setFiles([]);
              setFilePreviewUrl(null);
            }}
            style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--accent-error)', borderColor: 'var(--accent-error)' }}
          >
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-error)',
            color: 'var(--accent-error)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>

          <button
            className="btn-secondary"
            onClick={() => {
              setErrorMessage(null);
              setStep(Step.CONFIGURE);
            }}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              color: 'var(--accent-error)',
              borderColor: 'var(--accent-error)',
              background: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <RefreshCw size={13} />
            <span>Reset / Retry</span>
          </button>
        </div>
      )}


      {/* STEP 1: CONFIGURE & PICK MULTIPLE FILES */}
      {step === Step.CONFIGURE && (
        <>
          {tool.id !== 'audio_tts' && (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-color)',
                background: 'var(--surface-card)',
                textAlign: 'center',
              }}
            >
              <input
                type="file"
                id="file-input"
                multiple={true}
                accept={tool.acceptedMimeTypes.join(',')}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload size={36} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {files.length === 0 ? 'Choose or Pick Pictures / Files' : 'Add More Pictures / Files'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {files.length > 0 ? `${files.length} picked so far. Tap to choose more.` : `Accepts ${tool.acceptedMimeTypes.join(', ')}`}
                </div>
              </label>
            </div>
          )}

          {/* Interactive Multi-File Thumbnail Grid & Actions */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
                  SELECTED FILES ({files.length})
                </div>
                <label
                  htmlFor="file-input"
                  style={{
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PlusCircle size={15} />
                  <span>ADD MORE</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <FileThumbnailItem
                          file={file}
                          onClickPreview={isImage ? () => handlePreviewInputFile(file) : undefined}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {idx + 1}. {file.name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      {/* Interactive Preview, Crop & Reorder Toolbar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isImage && (
                          <>
                            <button
                              className="btn-secondary"
                              onClick={() => handlePreviewInputFile(file)}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Preview Image"
                            >
                              <Eye size={14} />
                              <span>Preview</span>
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setCroppingFileIndex(idx)}
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--accent-primary)' }}
                              title="Crop Image"
                            >
                              <Crop size={14} />
                              <span>Crop</span>
                            </button>
                          </>
                        )}

                        {files.length > 1 && (
                          <>
                            <button
                              onClick={() => handleMoveFile(idx, 'UP')}
                              disabled={idx === 0}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: idx === 0 ? 'default' : 'pointer',
                                padding: '4px',
                                opacity: idx === 0 ? 0.3 : 1,
                              }}
                              title="Move Up"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => handleMoveFile(idx, 'DOWN')}
                              disabled={idx === files.length - 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: idx === files.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: idx === files.length - 1 ? 'default' : 'pointer',
                                padding: '4px',
                                opacity: idx === files.length - 1 ? 0.3 : 1,
                              }}
                              title="Move Down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleRemoveFile(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-error)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Remove File"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parameters Box */}
          <div
            style={{
              padding: '16px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <Sliders size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>TOOL PARAMETERS & OPTIONS</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                OUTPUT FILE NAME
              </label>
              <input
                type="text"
                className="search-input"
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
              />
            </div>

            {/* Audio Trim Waveform */}
            {tool.id === 'audio_trim' && files.length > 0 && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  WAVEFORM TRIM SELECTOR
                </label>
                <WaveformVisualizer
                  file={files[0]}
                  startTime={startTime}
                  endTime={endTime}
                  onRangeChange={(start, end) => {
                    setStartTime(start);
                    setEndTime(end);
                  }}
                />
              </div>
            )}

            {/* Text to Speech */}
            {tool.id === 'audio_tts' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  TEXT PROMPT TO SYNTHESIZE
                </label>
                <textarea
                  className="search-input"
                  style={{
                    background: 'var(--bg-tertiary)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                />
              </div>
            )}

            {/* Image to PDF */}
            {tool.id === 'img_pdf' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  PAGE ORIENTATION
                </label>
                <SegmentedControl
                  options={[
                    { label: 'PORTRAIT', value: 'PORTRAIT' },
                    { label: 'LANDSCAPE', value: 'LANDSCAPE' },
                  ]}
                  selectedValue={orientation}
                  onChange={setOrientation}
                />
              </div>
            )}

            {/* Image Resize */}
            {tool.id === 'img_resize' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    WIDTH (PX)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="search-input"
                    style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    HEIGHT (PX)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="search-input"
                    style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>
            )}

            {/* Image Rotate */}
            {(tool.id === 'img_rotate' || tool.id === 'video_rotate') && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  ROTATION ANGLE
                </label>
                <SegmentedControl
                  options={[
                    { label: '90° CW', value: '90' },
                    { label: '180°', value: '180' },
                    { label: '270° CW', value: '270' },
                  ]}
                  selectedValue={String(degrees)}
                  onChange={(val) => setDegrees(Number(val))}
                />
              </div>
            )}

            {/* Image Convert Format */}
            {tool.id === 'img_convert' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  TARGET FORMAT
                </label>
                <SegmentedControl
                  options={[
                    { label: 'PNG', value: 'png' },
                    { label: 'JPG', value: 'jpg' },
                    { label: 'WEBP', value: 'webp' },
                  ]}
                  selectedValue={format}
                  onChange={setFormat}
                />
              </div>
            )}

            {/* Compress Quality */}
            {tool.id === 'img_compress' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  COMPRESSION QUALITY ({quality}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            )}

            {/* PDF Watermark */}
            {(tool.id === 'pdf_watermark' || tool.id === 'img_watermark') && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  WATERMARK TEXT
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{
                    background: 'var(--bg-tertiary)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                />
              </div>
            )}

            {/* PDF Split */}
            {tool.id === 'pdf_split' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    START PAGE
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="search-input"
                    style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    END PAGE
                  </label>
                  <input
                    type="number"
                    min={startPage}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="search-input"
                    style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            disabled={tool.id !== 'audio_tts' && files.length === 0}
            onClick={handleStartProcessing}
            style={{ marginTop: '8px' }}
          >
            <span>START PROCESSING ({files.length} {files.length === 1 ? 'FILE' : 'FILES'})</span>
          </button>
        </>
      )}

      {/* STEP 2: PROCESSING */}
      {step === Step.PROCESSING && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <RefreshCw size={44} style={{ color: 'var(--accent-primary)', animation: 'spin 1.5s linear infinite' }} />
          </div>

          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Processing Engine Active
            </div>
            <div style={{ fontSize: '13px', color: 'var(--accent-primary)', marginTop: '4px', fontWeight: 600 }}>
              {progressStepText}
            </div>
          </div>

          <div className="progress-bar-bg" style={{ maxWidth: '300px' }}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
            {progressPct.toFixed(0)}% COMPLETED
          </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === Step.RESULT && outputResult && (
        <div
          style={{
            padding: '24px',
            background: 'var(--surface-card)',
            border: '1px solid var(--accent-success)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
          }}
          className="animate-fade-in"
        >
          <CheckCircle2 size={48} style={{ color: 'var(--accent-success)' }} />

          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Operation Complete!
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {outputResult.outputFileName} ({outputResult.fileSizeFormatted})
            </div>
          </div>

          {/* Live Preview Container */}
          {tool.family === ToolFamily.IMAGE && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="preview-container">
                <img src={outputResult.downloadUrl} alt="Output Result" />
              </div>
              <button
                className="btn-secondary"
                onClick={() => setShowFullPreviewModal(true)}
                style={{ alignSelf: 'center', padding: '6px 14px', fontSize: '12px' }}
              >
                <Eye size={15} />
                <span>FULLSCREEN PREVIEW</span>
              </button>
            </div>
          )}

          {tool.family === ToolFamily.AUDIO && (
            <div style={{ width: '100%', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <audio controls src={outputResult.downloadUrl} style={{ width: '100%' }} />
            </div>
          )}

          {tool.family === ToolFamily.VIDEO && (
            <div className="preview-container">
              <video controls src={outputResult.downloadUrl} style={{ width: '100%', maxHeight: '260px' }} />
            </div>
          )}

          {/* Extracted Text */}
          {outputResult.extractedText && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  textAlign: 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {outputResult.extractedText}
              </div>
              <button
                className="btn-secondary"
                onClick={() => handleCopyText(outputResult.extractedText!)}
                style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: '12px' }}
              >
                <Copy size={14} />
                <span>{copiedText ? 'COPIED!' : 'COPY EXTRACTED TEXT'}</span>
              </button>
            </div>
          )}

          {/* Action Buttons: Save & Share */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <button onClick={handleSaveOutput} className="btn-primary" style={{ width: '100%' }}>
              <Download size={18} />
              <span>SAVE TO DOWNLOADS FOLDER</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setStep(Step.CONFIGURE)} style={{ justifyContent: 'center' }}>
                <Sliders size={16} />
                <span>RE-EDIT PARAMS</span>
              </button>

              <button className="btn-secondary" onClick={handleShareOutput} style={{ justifyContent: 'center' }}>
                <Share2 size={16} />
                <span>SHARE FILE</span>
              </button>
            </div>

            <button
              className="btn-secondary"
              onClick={() => {
                setStep(Step.CONFIGURE);
                setFiles([]);
                setOutputResult(null);
                setFilePreviewUrl(null);
              }}
              style={{ justifyContent: 'center', marginTop: '4px' }}
            >
              PROCESS ANOTHER FILE
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {showFullPreviewModal && (filePreviewUrl || outputResult?.downloadUrl) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          className="animate-fade-in"
        >
          <button
            onClick={() => setShowFullPreviewModal(false)}
            data-close-modal="true"
            style={{
              position: 'absolute',
              top: 'calc(16px + var(--safe-top))',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={22} />
          </button>
          <img
            src={outputResult?.downloadUrl || filePreviewUrl!}
            alt="Fullscreen Preview"
            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />
        </div>
      )}

      {/* FREEHAND IMAGE CROPPER MODAL */}
      {croppingFileIndex !== null && files[croppingFileIndex] && (
        <ImageCropModal
          file={files[croppingFileIndex]}
          onApplyCrop={handleApplyCroppedImage}
          onClose={() => setCroppingFileIndex(null)}
        />
      )}
    </div>
  );
};

export default ToolWorkspaceScreen;
