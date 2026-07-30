// Shared task-review constants — the single source of truth for both the mobile
// Revision sheet and the web Review panel. Kept here (not per-app) so the two
// platforms can never drift on the quick-reason copy or the note length cap.

/** Quick-select revision reasons shown as chips on the Request Changes UI. */
export const QUICK_REVISION_REASONS: string[] = [
  'Incomplete proof',
  'Wrong format',
  'Needs more detail',
  'Missing sign-off',
];

/** Max characters allowed in a free-text revision note. */
export const REVISION_NOTE_MAX_LENGTH = 500;
