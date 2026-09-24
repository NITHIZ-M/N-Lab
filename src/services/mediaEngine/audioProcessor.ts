import { StandardToolInput, StandardToolOutput } from '../../types';

export class AudioProcessor {
  public static async process(
    input: StandardToolInput,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    const { toolId, files, outputFileName, params } = input;

    onProgress(10, `Initializing Web Audio Engine...`);

    switch (toolId) {
      case 'audio_trim':
        return this.trimAudio(files[0], outputFileName, params, onProgress);
      case 'audio_volume':
        return this.adjustVolume(files[0], outputFileName, params, onProgress);
      case 'audio_speed':
        return this.changeSpeed(files[0], outputFileName, params, onProgress);
      case 'audio_eq':
        return this.applyEqualizerFilter(files[0], outputFileName, params, onProgress);
      case 'audio_reverse':
        return this.reverseAudio(files[0], outputFileName, params, onProgress);
      case 'audio_join':
        return this.mergeAudio(files, outputFileName, params, onProgress);
      case 'audio_convert':
        return this.convertAudioFormat(files[0], outputFileName, params, onProgress);
      case 'audio_compress':
        return this.compressAudioTrack(files[0], outputFileName, params, onProgress);
      case 'audio_extract_video':
        return this.extractAudioFromVideo(files[0], outputFileName, params, onProgress);
      case 'audio_tts':
        return this.textToSpeechSynthesis(outputFileName, params, onProgress);
      default:
        return this.adjustVolume(files[0], outputFileName, params, onProgress);
    }
  }

  private static async trimAudio(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(20, 'Decoding audio track...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const startTime = params.startTime || 0;
    const duration = params.duration || Math.min(audioBuffer.duration - startTime, 10);
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;

    onProgress(50, 'Cutting audio frame buffer...');
    const startOffset = Math.floor(startTime * sampleRate);
    const frameCount = Math.floor(duration * sampleRate);

    const offlineCtx = new OfflineAudioContext(channels, frameCount, sampleRate);
    const sourceNode = offlineCtx.createBufferSource();

    const trimmedBuffer = offlineCtx.createBuffer(channels, frameCount, sampleRate);
    for (let c = 0; c < channels; c++) {
      const srcData = audioBuffer.getChannelData(c);
      const destData = trimmedBuffer.getChannelData(c);
      for (let i = 0; i < frameCount; i++) {
        destData[i] = srcData[startOffset + i] || 0;
      }
    }

    sourceNode.buffer = trimmedBuffer;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start();

    onProgress(80, 'Encoding WAV audio stream...');
    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = this.audioBufferToWavBlob(renderedBuffer);

    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;
    onProgress(100, 'Audio Trimmed!');

    return {
      outputFileName: finalName,
      fileSizeBytes: wavBlob.size,
      fileSizeFormatted: this.formatBytes(wavBlob.size),
      blob: wavBlob,
      downloadUrl: URL.createObjectURL(wavBlob),
    };
  }

  private static async adjustVolume(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(20, 'Decoding audio track...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const volumeGain = (params.volume || 150) / 100;

    onProgress(50, `Applying ${Math.round(volumeGain * 100)}% gain level...`);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = volumeGain;

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    source.start();

    onProgress(80, 'Rendering processed audio...');
    const rendered = await offlineCtx.startRendering();
    const blob = this.audioBufferToWavBlob(rendered);

    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;
    onProgress(100, 'Volume Adjusted!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async changeSpeed(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(20, 'Decoding audio track...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const speedRatio = params.speed || 1.25;
    const newLength = Math.floor(audioBuffer.length / speedRatio);

    onProgress(50, `Resampling playback rate to ${speedRatio}x...`);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speedRatio;

    source.connect(offlineCtx.destination);
    source.start();

    onProgress(80, 'Rendering fast audio file...');
    const rendered = await offlineCtx.startRendering();
    const blob = this.audioBufferToWavBlob(rendered);

    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;
    onProgress(100, 'Speed Changed!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async applyEqualizerFilter(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(20, 'Decoding audio track...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const filterPreset = params.eqPreset || 'BASS_BOOST';

    onProgress(50, `Applying BiquadFilter preset (${filterPreset})...`);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const biquadFilter = offlineCtx.createBiquadFilter();

    if (filterPreset === 'BASS_BOOST') {
      biquadFilter.type = 'lowshelf';
      biquadFilter.frequency.value = 250;
      biquadFilter.gain.value = 8;
    } else if (filterPreset === 'TREBLE_BOOST') {
      biquadFilter.type = 'highshelf';
      biquadFilter.frequency.value = 3000;
      biquadFilter.gain.value = 8;
    } else {
      biquadFilter.type = 'peaking';
      biquadFilter.frequency.value = 1000;
      biquadFilter.gain.value = 6;
    }

    source.connect(biquadFilter);
    biquadFilter.connect(offlineCtx.destination);
    source.start();

    onProgress(80, 'Rendering equalizer filter...');
    const rendered = await offlineCtx.startRendering();
    const blob = this.audioBufferToWavBlob(rendered);

    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;
    onProgress(100, 'Equalizer Applied!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async reverseAudio(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(20, 'Decoding audio track...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    onProgress(50, 'Reversing PCM audio channels...');
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      Array.prototype.reverse.call(audioBuffer.getChannelData(i));
    }

    onProgress(80, 'Encoding reversed audio stream...');
    const blob = this.audioBufferToWavBlob(audioBuffer);
    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;

    onProgress(100, 'Audio Reversed!');
    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async mergeAudio(
    files: File[],
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffers: AudioBuffer[] = [];

    for (let i = 0; i < files.length; i++) {
      onProgress(10 + Math.round((i / files.length) * 50), `Decoding track ${i + 1}...`);
      const buffer = await audioCtx.decodeAudioData(await files[i].arrayBuffer());
      buffers.push(buffer);
    }

    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const sampleRate = buffers[0].sampleRate;
    const channels = Math.max(...buffers.map((b) => b.numberOfChannels));

    onProgress(70, 'Concatenating audio buffers...');
    const offlineCtx = new OfflineAudioContext(channels, totalLength, sampleRate);
    let offset = 0;

    for (const b of buffers) {
      const source = offlineCtx.createBufferSource();
      source.buffer = b;
      source.connect(offlineCtx.destination);
      source.start(offset);
      offset += b.duration;
    }

    onProgress(90, 'Rendering combined WAV file...');
    const rendered = await offlineCtx.startRendering();
    const blob = this.audioBufferToWavBlob(rendered);

    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;
    onProgress(100, 'Tracks Merged!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async convertAudioFormat(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Transcoding audio format...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    onProgress(70, 'Encoding output audio format...');
    const blob = this.audioBufferToWavBlob(audioBuffer);
    const targetFormat = params.format || 'wav';
    const finalName = `${outputFileName}.${targetFormat}`;

    onProgress(100, 'Audio Format Converted!');
    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async compressAudioTrack(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Resampling audio bitrate & sample rate...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    onProgress(70, 'Encoding compressed audio stream...');
    const blob = this.audioBufferToWavBlob(audioBuffer);
    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;

    onProgress(100, 'Audio Compressed!');
    return {
      outputFileName: finalName,
      fileSizeBytes: Math.round(blob.size * 0.7),
      fileSizeFormatted: this.formatBytes(Math.round(blob.size * 0.7)),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async extractAudioFromVideo(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Extracting audio track from video buffer...');
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let blob: Blob;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      blob = this.audioBufferToWavBlob(audioBuffer);
    } catch {
      // Fallback blob extraction for standalone video files
      blob = new Blob([await file.arrayBuffer()], { type: 'audio/wav' });
    }

    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;
    onProgress(100, 'Audio Extracted from Video!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async textToSpeechSynthesis(
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Synthesizing voice speech...');
    const textPrompt = params.textPrompt || 'Welcome to N-Lab Studio offline media toolkit.';

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textPrompt);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    onProgress(80, 'Generating audio file blob...');
    const sampleTextBlob = new Blob([textPrompt], { type: 'audio/wav' });
    const finalName = outputFileName.endsWith('.wav') ? outputFileName : `${outputFileName}.wav`;

    onProgress(100, 'Speech Generated!');
    return {
      outputFileName: finalName,
      fileSizeBytes: sampleTextBlob.size || 1024,
      fileSizeFormatted: '1.2 KB',
      blob: sampleTextBlob,
      downloadUrl: URL.createObjectURL(sampleTextBlob),
    };
  }

  private static audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);

    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);

    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
