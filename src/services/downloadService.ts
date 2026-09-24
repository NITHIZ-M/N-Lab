import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export class DownloadService {
  /**
   * Converts a Blob object into a Base64 string.
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Directly saves a file to the user's public Documents/Downloads directory on Android or triggers browser download.
   */
  public static async saveFile(blob: Blob, fileName: string): Promise<{ success: boolean; message: string }> {
    try {
      const isNative = Capacitor.isNativePlatform();

      // 1. Native Capacitor Android / iOS APK Direct File Save
      if (isNative) {
        try {
          const base64Data = await this.blobToBase64(blob);

          // Write directly to Documents directory under 'N-Lab' folder
          await Filesystem.writeFile({
            path: `N-Lab/${fileName}`,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true,
          });

          return { success: true, message: `File saved to Documents/N-Lab/${fileName}` };
        } catch (nativeErr: any) {
          console.warn('Native Documents save failed, trying Cache directory:', nativeErr);
          try {
            const base64Data = await this.blobToBase64(blob);
            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache,
            });
            return { success: true, message: `File saved to device storage: ${fileName}` };
          } catch (cacheErr) {
            console.warn('Cache write failed:', cacheErr);
          }
        }
      }

      // 2. Web Browser Programmatic <a> link click
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 2000);

      return { success: true, message: `Saved to Downloads: ${fileName}` };
    } catch (err: any) {
      console.error('File saving failed:', err);
      return { success: false, message: `Save error: ${err.message || err}` };
    }
  }

  /**
   * Opens native share sheet for the file.
   */
  public static async shareFile(blob: Blob, fileName: string): Promise<{ success: boolean; message: string }> {
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const base64Data = await this.blobToBase64(blob);
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: fileName,
          text: `Exported from N-Lab Studio: ${fileName}`,
          url: savedFile.uri,
          dialogTitle: 'Share File',
        });
        return { success: true, message: 'Share sheet opened' };
      }

      if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: blob.type })] })) {
        const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Exported from N-Lab Studio: ${fileName}`,
        });
        return { success: true, message: 'File shared' };
      }

      // Fallback
      return await this.saveFile(blob, fileName);
    } catch (err: any) {
      if (err.name === 'AbortError') return { success: true, message: 'Share cancelled' };
      return { success: false, message: `Share error: ${err.message || err}` };
    }
  }
}
