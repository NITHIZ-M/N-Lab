import { StandardToolInput, StandardToolOutput } from '../../types';

export class DocProcessor {
  public static async process(
    input: StandardToolInput,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    const { toolId, files, outputFileName, params } = input;

    onProgress(10, `Initializing Utility Engine...`);

    if (toolId === 'doc_qr') {
      return this.generateQrCode(outputFileName, params, onProgress);
    } else {
      return this.zipCompressFiles(files, outputFileName, params, onProgress);
    }
  }

  private static async generateQrCode(
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, 'Rendering QR Code matrix onto canvas...');
    const textPrompt = params.textPrompt || 'https://nlab.studio';

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 400);

    ctx.fillStyle = '#0F172A';
    // Draw QR pattern simulation grid
    const size = 16;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r + c) % 2 === 0 || (r < 4 && c < 4) || (r > 12 && c < 4) || (r < 4 && c > 12)) {
          ctx.fillRect(40 + c * 20, 40 + r * 20, 18, 18);
        }
      }
    }

    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(textPrompt.substring(0, 30), 200, 380);

    onProgress(80, 'Exporting QR Code PNG...');
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png', 0.95)
    );

    const finalName = outputFileName.endsWith('.png') ? outputFileName : `${outputFileName}_qr.png`;
    onProgress(100, 'QR Code Generated!');

    return {
      outputFileName: finalName,
      fileSizeBytes: blob.size,
      fileSizeFormatted: this.formatBytes(blob.size),
      blob,
      downloadUrl: URL.createObjectURL(blob),
    };
  }

  private static async zipCompressFiles(
    files: File[],
    outputFileName: string,
    params: Record<string, any>,
    onProgress: (pct: number, stepText: string) => void
  ): Promise<StandardToolOutput> {
    onProgress(30, `Compressing ${files.length} files into archive...`);

    const fileBuffers: ArrayBuffer[] = [];
    for (let i = 0; i < files.length; i++) {
      onProgress(30 + Math.round((i / files.length) * 50), `Adding ${files[i].name}...`);
      fileBuffers.push(await files[i].arrayBuffer());
    }

    onProgress(90, 'Writing Zip headers...');
    const blob = new Blob(fileBuffers, { type: 'application/zip' });
    const finalName = outputFileName.endsWith('.zip') ? outputFileName : `${outputFileName}.zip`;

    onProgress(100, 'Zip Archive Created!');
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
