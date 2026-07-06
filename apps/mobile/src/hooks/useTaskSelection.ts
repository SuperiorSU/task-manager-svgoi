import { useCallback, useState } from 'react';

/** Long-press-to-multi-select state for a task list (Admin bulk cancel). */
export const useTaskSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectionMode = selectedIds.size > 0;

  const enter = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return { selectionMode, selectedIds, enter, toggle, clear };
};
