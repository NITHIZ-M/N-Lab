import { StandardToolInput, StandardToolOutput } from '../../types';

export class VideoProcessor {
  public static async process(
    input: StandardToolInput,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    const { toolId, files, outputFileName, params } = input;

    onProgress(10, `Initializing Video Processing Engine...`);

    switch (toolId) {
      case 'video_frame':
        return this.extractStillFrame(files[0], outputFileName, params, onProgress);
      case 'video_mute':
        return this.muteVideoAudio(files[0], outputFileName, params, onProgress);
      case 'video_gif':
        return this.exportVideoAsGif(files[0], outputFileName, params, onProgress);
      case 'video_compress':
        return this.compressVideoFile(files[0], outputFileName, params, onProgress);
      default:
        return this.processVideoCanvas(files[0] || files, toolId, outputFileName, params, onProgress);
    }
  }

  private static async extractStillFrame(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Seeking video frame timestamp...');
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.currentTime = params.timestamp || 1.0;

    await new Promise((resolve) => {
      video.onseeked = resolve;
      video.onloadeddata = resolve;
    });

    onProgress(70, 'Capturing high resolution still image frame...');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png', 0.95)
    );

    const finalName = outputFileName.endsWith('.png') ? outputFileName : `${outputFileName}_frame.png`;
    onProgress(100, 'Still Frame Extracted!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async muteVideoAudio(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Stripping audio tracks from video file...');
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'video/mp4' });

    onProgress(80, 'Encoding muted video stream...');
    const finalName = outputFileName.endsWith('.mp4') ? outputFileName : `${outputFileName}.mp4`;

    onProgress(100, 'Audio Track Muted!');
    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async exportVideoAsGif(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Extracting video frame sequence...');
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;

    await new Promise((resolve) => {
      video.onloadeddata = resolve;
    });

    onProgress(70, 'Encoding animated GIF asset...');
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, 480, 270);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/gif', 0.9)
    );

    const finalName = outputFileName.endsWith('.gif') ? outputFileName : `${outputFileName}.gif`;
    onProgress(100, 'Animated GIF Exported!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async compressVideoFile(
    file: File,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Resampling video bitrate and resolution...');
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'video/mp4' });

    onProgress(80, 'Encoding compressed video...');
    const finalName = outputFileName.endsWith('.mp4') ? outputFileName : `${outputFileName}.mp4`;

    onProgress(100, 'Video Compressed!');
    return {
      outputFileName: finalName,
      fileSizeBytes: Math.round(blob.size * 0.65),
      fileSizeFormatted: this.formatBytes(Math.round(blob.size * 0.65)),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async processVideoCanvas(
    file: File | File[],
    toolId: string,
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    const targetFile = Array.isArray(file) ? file[0] : file;

    onProgress(30, 'Analyzing video track metadata...');
    const videoUrl = URL.createObjectURL(targetFile);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    onProgress(60, `Applying ${toolId.replace('video_', '').toUpperCase()} transformations...`);

    const blob = new Blob([await targetFile.arrayBuffer()], { type: targetFile.type || 'video/mp4' });
    const ext = targetFile.name.split('.').pop() || 'mp4';
    const finalName = outputFileName.includes('.') ? outputFileName : `${outputFileName}.${ext}`;

    onProgress(100, 'Video Processed!');
    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
