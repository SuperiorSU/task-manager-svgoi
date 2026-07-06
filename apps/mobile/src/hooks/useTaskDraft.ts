import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TaskPriority, User } from '@godigitify/types';

// Crash-resilience for the Create Task form: the in-progress form is auto-saved
// to AsyncStorage (debounced) so an abrupt exit/kill doesn't lose it. This is
// NOT the full "Save as Draft" feature (deferred to v1.1) — just recovery.
// Local file attachments are intentionally excluded (their URIs are transient).
export type TaskDraftData = {
  title: string;
  description: string;
  departmentId: string;
  assignees: User[];
  priority: TaskPriority;
  /** ISO string. */
  pickedDate: string;
  dueHour: number;
  dueMinute: number;
  isAfternoon: boolean;
  categoryIds: string[];
  isRecurring: boolean;
};

const keyFor = (userId: string) => `task-draft:${userId}`;
const SAVE_DEBOUNCE_MS = 500;

export const useTaskDraft = (userId: string | undefined) => {
  const key = userId ? keyFor(userId) : null;
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<TaskDraftData | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    if (!key) {
      setHydrated(true);
      return;
    }
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            setDraft(JSON.parse(raw) as TaskDraftData);
          } catch {
            // Corrupt draft — ignore, treat as no draft.
          }
        }
        setHydrated(true);
      })
      .catch(() => active && setHydrated(true));
    return () => {
      active = false;
    };
  }, [key]);

  const saveDraft = useCallback(
    (data: TaskDraftData) => {
      if (!key) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => undefined);
      }, SAVE_DEBOUNCE_MS);
    },
    [key]
  );

  const clearDraft = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!key) return;
    void AsyncStorage.removeItem(key).catch(() => undefined);
  }, [key]);

  return { hydrated, draft, saveDraft, clearDraft };
};
