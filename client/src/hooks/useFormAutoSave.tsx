/**
 * Form Auto-Save Hook
 *
 * Provides automatic form data persistence to localStorage with debouncing,
 * visual status feedback, and versioning for schema changes.
 *
 * @example
 * ```tsx
 * const { savedData, saveStatus, clearSavedData, lastSavedAt } = useFormAutoSave({
 *   key: 'project-registration',
 *   data: formData,
 *   version: 1,
 *   debounceMs: 1000,
 * });
 *
 * // On mount, check if there's saved data to restore
 * useEffect(() => {
 *   if (savedData) {
 *     setFormData(savedData);
 *   }
 * }, []);
 *
 * // Show save status in UI
 * <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}</span>
 *
 * // On successful submit, clear saved data
 * const onSubmit = async () => {
 *   await submitForm();
 *   clearSavedData();
 * };
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveOptions<T> {
  /** Unique key for localStorage. Use a descriptive name like 'project-registration-v1' */
  key: string;
  /** Current form data to save */
  data: T;
  /** Version number - increment when form schema changes to invalidate old saved data */
  version?: number;
  /** Debounce delay in milliseconds (default: 1000ms) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when data is restored from storage */
  onRestore?: (data: T) => void;
  /** Callback when save completes */
  onSave?: () => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
}

interface SavedFormData<T> {
  data: T;
  version: number;
  timestamp: number;
}

interface AutoSaveResult<T> {
  /** Previously saved data (if any, matching current version) */
  savedData: T | null;
  /** Current save status */
  saveStatus: SaveStatus;
  /** Timestamp of last save */
  lastSavedAt: Date | null;
  /** Clear all saved data for this form */
  clearSavedData: () => void;
  /** Force an immediate save */
  forceSave: () => void;
  /** Check if there's unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Hook for automatic form data persistence with debouncing
 */
export function useFormAutoSave<T>({
  key,
  data,
  version = 1,
  debounceMs = 1000,
  enabled = true,
  onRestore,
  onSave,
  onError,
}: AutoSaveOptions<T>): AutoSaveResult<T> {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedData, setSavedData] = useState<T | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);
  const lastSavedDataRef = useRef<string>("");

  const storageKey = `abfi-form-${key}`;

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: SavedFormData<T> = JSON.parse(stored);

        // Check version compatibility
        if (parsed.version === version) {
          setSavedData(parsed.data);
          setLastSavedAt(new Date(parsed.timestamp));
          lastSavedDataRef.current = JSON.stringify(parsed.data);
          onRestore?.(parsed.data);
        } else {
          // Version mismatch - clear old data
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn("[AutoSave] Failed to load saved form data:", error);
      localStorage.removeItem(storageKey);
    }

    initialLoadRef.current = false;
  }, [storageKey, version, enabled, onRestore]);

  // Save data with debounce
  const saveToStorage = useCallback(
    (dataToSave: T) => {
      try {
        const saveData: SavedFormData<T> = {
          data: dataToSave,
          version,
          timestamp: Date.now(),
        };

        localStorage.setItem(storageKey, JSON.stringify(saveData));
        lastSavedDataRef.current = JSON.stringify(dataToSave);
        setLastSavedAt(new Date());
        setSaveStatus("saved");
        setHasUnsavedChanges(false);
        onSave?.();

        // Reset status after showing "Saved"
        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("[AutoSave] Failed to save form data:", error);
        setSaveStatus("error");
        onError?.(error instanceof Error ? error : new Error("Save failed"));
      }
    },
    [storageKey, version, onSave, onError]
  );

  // Debounced save effect
  useEffect(() => {
    if (!enabled || initialLoadRef.current) return;

    // Check if data has actually changed
    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }

    setHasUnsavedChanges(true);
    setSaveStatus("saving");

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      saveToStorage(data);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, enabled, saveToStorage]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData(null);
      setLastSavedAt(null);
      setHasUnsavedChanges(false);
      lastSavedDataRef.current = "";
    } catch (error) {
      console.warn("[AutoSave] Failed to clear saved data:", error);
    }
  }, [storageKey]);

  // Force immediate save
  const forceSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    saveToStorage(data);
  }, [data, saveToStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    savedData,
    saveStatus,
    lastSavedAt,
    clearSavedData,
    forceSave,
    hasUnsavedChanges,
  };
}

/**
 * Component to display auto-save status
 */
export function AutoSaveIndicator({
  status,
  lastSavedAt,
  className = "",
}: {
  status: SaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}) {
  if (status === "idle" && !lastSavedAt) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <span
      className={`text-xs transition-opacity ${className}`}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && (
        <span className="text-muted-foreground">Saving draft...</span>
      )}
      {status === "saved" && (
        <span className="text-green-600">Draft saved</span>
      )}
      {status === "error" && (
        <span className="text-destructive">Failed to save</span>
      )}
      {status === "idle" && lastSavedAt && (
        <span className="text-muted-foreground">
          Last saved {formatTime(lastSavedAt)}
        </span>
      )}
    </span>
  );
}

export default useFormAutoSave;
