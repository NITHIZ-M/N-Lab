import { HistoryItem, UserPreferences } from '../types';

const PREFS_KEY = 'nlab_user_prefs_v2';
const HISTORY_KEY = 'nlab_history_v2';

const DEFAULT_PREFS: UserPreferences = {
  themeMode: 'dark',
  autoSaveHistory: true,
  compressionQuality: 80,
  defaultOutputFormat: 'pdf',
};

export class StorageService {
  public static getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      return data ? { ...DEFAULT_PREFS, ...JSON.parse(data) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  }

  public static savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
    return updated;
  }

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
