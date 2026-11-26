import React, {createContext, useCallback, useContext, useState} from 'react';
import type {ToolId} from '../types/liveData';

export type FilterPreference = 'all' | ToolId;

export interface UserPreferences {
  preferredTool: FilterPreference;
  preferredCurrency: string;
  preferredKarat: '24' | '21' | '18' | '14' | '12';
}

export interface SavedSnapshotItem {
  id: string;
  toolId: ToolId;
  dateLabelAr: string;
  headlineAr: string;
  primaryMetric: string;
  note?: string;
  createdAtIso: string;
}

interface LocalStorageContextValue {
  preferences: UserPreferences;
  snapshots: SavedSnapshotItem[];
  updatePreferences: (
    patch: Partial<Pick<UserPreferences, 'preferredTool' | 'preferredCurrency' | 'preferredKarat'>>,
  ) => void;
  saveSnapshot: (payload: {
    toolId: ToolId;
    dateLabelAr: string;
    headlineAr: string;
    primaryMetric: string;
    note?: string;
  }) => void;
  deleteSnapshot: (snapshotId: string) => void;
}

const PREFS_KEY = 'josour_preferences_v1';
const SNAPSHOTS_KEY = 'josour_snapshots_v1';

const VALID_TOOLS: FilterPreference[] = ['all', 'dollar', 'weather', 'currencies', 'gold', 'population', 'haram'];
const VALID_KARATS: UserPreferences['preferredKarat'][] = ['24', '21', '18', '14', '12'];

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTool: 'all',
  preferredCurrency: 'SAR',
  preferredKarat: '21',
};

function loadPreferences(): UserPreferences {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_PREFERENCES;
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      preferredTool:
        parsed.preferredTool && VALID_TOOLS.includes(parsed.preferredTool)
          ? parsed.preferredTool
          : 'all',
      preferredCurrency:
        parsed.preferredCurrency && /^[A-Z]{3}$/.test(parsed.preferredCurrency)
          ? parsed.preferredCurrency
          : 'SAR',
      preferredKarat:
        parsed.preferredKarat && VALID_KARATS.includes(parsed.preferredKarat)
          ? parsed.preferredKarat
          : '21',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function loadSnapshots(): SavedSnapshotItem[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedSnapshotItem[]) : [];
  } catch {
    return [];
  }
}

function persistJson(key: string, value: unknown) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore quota/private-mode storage errors
  }
}

const LocalStorageContext = createContext<LocalStorageContextValue | null>(null);

export const LocalStorageProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [snapshots, setSnapshots] = useState<SavedSnapshotItem[]>(() => loadSnapshots());

  const updatePreferences = useCallback(
    (patch: Partial<Pick<UserPreferences, 'preferredTool' | 'preferredCurrency' | 'preferredKarat'>>) => {
      setPreferences((prev) => {
        const next: UserPreferences = {
          preferredTool:
            patch.preferredTool && VALID_TOOLS.includes(patch.preferredTool)
              ? patch.preferredTool
              : prev.preferredTool,
          preferredCurrency:
            patch.preferredCurrency && /^[A-Z]{3}$/.test(patch.preferredCurrency)
              ? patch.preferredCurrency
              : prev.preferredCurrency,
          preferredKarat:
            patch.preferredKarat && VALID_KARATS.includes(patch.preferredKarat)
              ? patch.preferredKarat
              : prev.preferredKarat,
        };
        persistJson(PREFS_KEY, next);
        return next;
      });
    },
    [],
  );

  const saveSnapshot = useCallback(
    (payload: {
      toolId: ToolId;
      dateLabelAr: string;
      headlineAr: string;
      primaryMetric: string;
      note?: string;
    }) => {
      const cleanNote = payload.note ? payload.note.trim().slice(0, 240) : '';
      const newItem: SavedSnapshotItem = {
        id: `${payload.toolId}-${Date.now()}`,
        toolId: payload.toolId,
        dateLabelAr: payload.dateLabelAr.trim().slice(0, 80) || 'اليوم',
        headlineAr: payload.headlineAr.trim().slice(0, 140) || 'لقطة جسور',
        primaryMetric: payload.primaryMetric.trim().slice(0, 80) || '-',
        ...(cleanNote ? {note: cleanNote} : {}),
        createdAtIso: new Date().toISOString(),
      };
      setSnapshots((prev) => {
        const next = [newItem, ...prev].slice(0, 30);
        persistJson(SNAPSHOTS_KEY, next);
        return next;
      });
    },
    [],
  );

  const deleteSnapshot = useCallback((snapshotId: string) => {
    setSnapshots((prev) => {
      const next = prev.filter((item) => item.id !== snapshotId);
      persistJson(SNAPSHOTS_KEY, next);
      return next;
    });
  }, []);

  return (
    <LocalStorageContext.Provider
      value={{
        preferences,
        snapshots,
        updatePreferences,
        saveSnapshot,
        deleteSnapshot,
      }}
    >
      {children}
    </LocalStorageContext.Provider>
  );
};

export function useLocalStorageData() {
  const ctx = useContext(LocalStorageContext);
  if (!ctx) {
    throw new Error('useLocalStorageData must be used inside LocalStorageProvider');
  }
  return ctx;
}
