export enum ToolFamily {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum ToolCategory {
  CONVERT = 'CONVERT',
  EDIT = 'EDIT',
  OPTIMIZE = 'OPTIMIZE',
  SECURE = 'SECURE',
  AI_SMART = 'AI & SMART',
}

export interface CategoryInfo {
  label: string;
  badgeBg: string;
  textColor: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  family: ToolFamily;
  category: ToolCategory;
  iconName: string;
  acceptedMimeTypes: string[];
  minFiles?: number;
  maxFiles?: number;
  isPinnedToHome?: boolean;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  toolId: string;
  toolName: string;
  familyName: ToolFamily;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  timestamp: number;
  outputBlobUrl?: string;
  fileType?: string;
}

export interface UserPreferences {
  themeMode: 'system' | 'dark' | 'light';
  autoSaveHistory: boolean;
  compressionQuality: number;
  defaultOutputFormat: string;
  favoriteToolIds: string[];
  namingPattern: string;
  showSkeletonName: boolean;
  pdfCompression: 'low' | 'medium' | 'high';
  autoDownloadOnProcess: boolean;
}

export interface StandardToolInput {
  toolId: string;
  files: File[];
  outputFileName: string;
  params: Record<string, any>;
}

export interface StandardToolOutput {
  outputFileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  blob: Blob;
  downloadUrl: string;
  extractedText?: string;
  metadata?: Record<string, any>;
  pdfPageBitmaps?: string[];
}
