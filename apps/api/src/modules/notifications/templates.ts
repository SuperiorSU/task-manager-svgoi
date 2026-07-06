import type { NotificationType } from '@godigitify/types';

type TemplateInput = {
  actorName?: string | undefined;
  taskTitle?: string | undefined;
  statusLabel?: string | undefined;
};

// Push/in-app copy is intentionally generic: never include task descriptions,
// comment text, or attachment names here — this renders on lock screens and
// notification shades, which are a different trust boundary than the app itself.
export const buildNotificationContent = (
  type: NotificationType,
  input: TemplateInput
): { title: string; body: string } => {
  const actor = input.actorName ?? 'Someone';
  const task = input.taskTitle ? `"${input.taskTitle}"` : 'a task';

  switch (type) {
    case 'TASK_ASSIGNED':
      return { title: 'Task assigned', body: `${actor} assigned you ${task}.` };
    case 'TASK_REASSIGNED':
      return { title: 'Task reassigned', body: `${actor} reassigned ${task} to you.` };
    case 'TASK_STATUS_CHANGED':
      return {
        title: 'Task update',
        body: input.statusLabel ? `${task} is now ${input.statusLabel}.` : `${task} was updated.`,
      };
    case 'TASK_COMPLETED':
      return { title: 'Task completed', body: `${task} was approved and marked complete.` };
    case 'TASK_DUE_SOON':
      return { title: 'Due soon', body: `${task} is due soon — take a look.` };
    case 'TASK_OVERDUE':
      return { title: 'Task overdue', body: `${task} is overdue and needs attention.` };
    case 'COMMENT_ADDED':
      return { title: 'New comment', body: `${actor} commented on ${task}.` };
    case 'CLARIFICATION_REQUESTED':
      return { title: 'Clarification requested', body: `${actor} requested clarification on ${task}.` };
    case 'CLARIFICATION_RESPONDED':
      return { title: 'Clarification response', body: `${actor} responded on ${task}.` };
    default:
      return { title: 'Notification', body: `Update on ${task}.` };
  }
};
