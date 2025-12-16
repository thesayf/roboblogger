import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';

interface AutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, delay = 500, enabled = true }: AutoSaveOptions) {
  const isSaving = useRef(false);
  const lastSavedData = useRef<string>('');

  // Create a debounced save function
  const debouncedSave = useRef(
    debounce(async (currentData: any) => {
      // Only save if data has actually changed
      const dataString = JSON.stringify(currentData);
      if (dataString === lastSavedData.current) {
        return;
      }

      if (!isSaving.current) {
        isSaving.current = true;
        try {
          await onSave(currentData);
          lastSavedData.current = dataString;
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          isSaving.current = false;
        }
      }
    }, delay)
  ).current;

  // Trigger auto-save when data changes
  useEffect(() => {
    if (enabled && data) {
      debouncedSave(data);
    }

    // Cleanup
    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  // Force save immediately (useful for critical updates)
  const saveNow = useCallback(async () => {
    debouncedSave.cancel();
    const dataString = JSON.stringify(data);
    if (dataString !== lastSavedData.current) {
      isSaving.current = true;
      try {
        await onSave(data);
        lastSavedData.current = dataString;
      } catch (error) {
        console.error('Save failed:', error);
      } finally {
        isSaving.current = false;
      }
    }
  }, [data, onSave, debouncedSave]);

  return { saveNow, isSaving: isSaving.current };
}