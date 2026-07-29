import type { Task } from '@godigitify/types';

// Task view-model type. Data now comes from the real API via tasks.service.ts;
// only the component-facing shape remains here (kept so pages need no changes).
export type TaskWithRelations = Task & {
  creator: { id: string; name: string; avatarUrl?: string | null };
  assignee: { id: string; name: string; avatarUrl?: string | null };
  department?: { id: string; name: string; code: string } | null;
  isCrossDept?: boolean;
  _count?: { comments: number; attachments: number };
};
