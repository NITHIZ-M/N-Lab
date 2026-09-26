import { HistoryItem, UserPreferences } from '../types';

const PREFS_KEY = 'nlab_user_prefs_v2';
const HISTORY_KEY = 'nlab_history_v2';
const FAVORITES_KEY = 'nlab_favorites_v2';

const DEFAULT_PREFS: UserPreferences = {
  themeMode: 'dark',
  autoSaveHistory: true,
  compressionQuality: 80,
  defaultOutputFormat: 'png',
  favoriteToolIds: ['img_pdf', 'img_compress', 'pdf_merge', 'audio_trim'],
  namingPattern: '[name]_[tool]',
  showSkeletonName: true,
  pdfCompression: 'medium',
  autoDownloadOnProcess: false,
};

export class StorageService {
  public static getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      const parsed = data ? JSON.parse(data) : {};
      const favorites = this.getFavorites();
      return {
        ...DEFAULT_PREFS,
        ...parsed,
        favoriteToolIds: favorites.length > 0 ? favorites : (parsed.favoriteToolIds || DEFAULT_PREFS.favoriteToolIds),
      };
    } catch {
      return DEFAULT_PREFS;
    }
  }

  public static savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      if (prefs.favoriteToolIds) {
        this.saveFavorites(prefs.favoriteToolIds);
      }
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
    return updated;
  }

  public static resetPreferences(): UserPreferences {
    try {
      localStorage.removeItem(PREFS_KEY);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(DEFAULT_PREFS.favoriteToolIds));
    } catch (e) {
      console.error('Failed to reset preferences:', e);
    }
    return DEFAULT_PREFS;
  }

  // FAVORITES PERSISTENCE
  public static getFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Migration from preferences if stored there
      const prefsData = localStorage.getItem(PREFS_KEY);
      if (prefsData) {
        const parsed = JSON.parse(prefsData);
        if (Array.isArray(parsed.favoriteToolIds)) {
          this.saveFavorites(parsed.favoriteToolIds);
          return parsed.favoriteToolIds;
        }
      }
      return DEFAULT_PREFS.favoriteToolIds;
    } catch {
      return DEFAULT_PREFS.favoriteToolIds;
    }
  }

  public static saveFavorites(favorites: string[]): string[] {
    try {
      const unique = Array.from(new Set(favorites));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(unique));
      // Sync into preferences object as well
      const prefsData = localStorage.getItem(PREFS_KEY);
      const currentPrefs = prefsData ? JSON.parse(prefsData) : {};
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...currentPrefs, favoriteToolIds: unique }));
      return unique;
    } catch (e) {
      console.error('Failed to save favorites:', e);
      return favorites;
    }
  }

  public static toggleFavorite(toolId: string): string[] {
    const current = this.getFavorites();
    const updated = current.includes(toolId)
      ? current.filter((id) => id !== toolId)
      : [...current, toolId];
    return this.saveFavorites(updated);
  }

  public static isFavorite(toolId: string): boolean {
    return this.getFavorites().includes(toolId);
  }

  public static clearFavorites(): string[] {
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch (e) {
      console.error('Failed to clear favorites:', e);
    }
    return [];
  }

  // HISTORY PERSISTENCE
  public static getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const history = this.getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
    };

    const updated = [newItem, ...history].slice(0, 50); // Keep last 50 items
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save history item:', e);
    }
    return newItem;
  }

  public static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }

  public static deleteHistoryItem(id: string): HistoryItem[] {
    const history = this.getHistory().filter((item) => item.id !== id);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to delete history item:', e);
    }
    return history;
  }
}

