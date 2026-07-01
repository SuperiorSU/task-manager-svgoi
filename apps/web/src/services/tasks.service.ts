import { MOCK_TASKS, type TaskWithRelations } from '@/data/tasks.mock';
import type { TaskStatus, TaskPriority } from '@godigitify/types';

const DELAY_MS = 400;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export type TaskListFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  departmentId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const tasksService = {
  async list(filters: TaskListFilters = {}) {
    await delay();
    const { status, priority, departmentId, assigneeId, search, page = 1, limit = 20, sortBy = 'dueDate', order = 'asc' } = filters;

    let items = MOCK_TASKS.filter((t) => !t.isDeleted);

    if (status) items = items.filter((t) => t.status === status);
    if (priority) items = items.filter((t) => t.priority === priority);
    if (departmentId) items = items.filter((t) => t.departmentId === departmentId);
    if (assigneeId) items = items.filter((t) => t.assigneeId === assigneeId);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (sortBy) {
        case 'priority':
          va = PRIORITY_ORDER[a.priority];
          vb = PRIORITY_ORDER[b.priority];
          break;
        case 'createdAt':
          va = a.createdAt;
          vb = b.createdAt;
          break;
        case 'title':
          va = a.title;
          vb = b.title;
          break;
        default:
          va = a.dueDate;
          vb = b.dueDate;
      }
      if (va < vb) return order === 'asc' ? -1 : 1;
      if (va > vb) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);
    return { items: paged, total, page, limit };
  },

  async get(id: string): Promise<TaskWithRelations> {
    await delay();
    const task = MOCK_TASKS.find((t) => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  },

  async getActivity(id: string) {
    await delay();
    return [
      {
        id: `act_${id}_1`,
        action: 'CREATE',
        note: 'Task created and assigned',
        createdAt: MOCK_TASKS.find((t) => t.id === id)?.createdAt ?? new Date().toISOString(),
        actor: MOCK_TASKS.find((t) => t.id === id)?.creator ?? null,
      },
      ...(MOCK_TASKS.find((t) => t.id === id)?.acceptedAt
        ? [{
            id: `act_${id}_2`,
            action: 'STATUS_CHANGED',
            note: 'Status changed: PENDING → ACCEPTED',
            createdAt: MOCK_TASKS.find((t) => t.id === id)!.acceptedAt!,
            actor: MOCK_TASKS.find((t) => t.id === id)?.assignee ?? null,
          }]
        : []),
    ];
  },

  async getComments(id: string) {
    await delay();
    const task = MOCK_TASKS.find((t) => t.id === id);
    if (!task) return [];
    return Array.from({ length: task._count?.comments ?? 0 }, (_, i) => ({
      id: `comment_${id}_${i}`,
      content: `Sample comment ${i + 1} on this task.`,
      author: task.assignee,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
  },

  async updateStatus(id: string, status: TaskStatus) {
    await delay();
    const task = MOCK_TASKS.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');
    // In production this would call PATCH /tasks/:id/status
    // For mock: update in-memory (non-persistent)
    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  },

  async create(dto: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string;
    assigneeId: string;
    departmentId?: string;
  }) {
    await delay();
    const id = `task_${Date.now()}`;
    const newTask: TaskWithRelations = {
      id,
      title: dto.title,
      description: dto.description,
      status: 'PENDING',
      priority: dto.priority,
      dueDate: dto.dueDate,
      isRecurring: false,
      isDeleted: false,
      creatorId: 'user_sa',
      assigneeId: dto.assigneeId,
      departmentId: dto.departmentId,
      creator: { id: 'user_sa', name: 'Dr. Ramesh Iyer' },
      assignee: { id: dto.assigneeId, name: 'Assignee' },
      _count: { comments: 0, attachments: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_TASKS.unshift(newTask);
    return newTask;
  },

  async delete(id: string) {
    await delay();
    const task = MOCK_TASKS.find((t) => t.id === id);
    if (task) task.isDeleted = true;
    return { success: true };
  },

  async bulkUpdateStatus(taskIds: string[], status: TaskStatus) {
    await delay();
    taskIds.forEach((id) => {
      const task = MOCK_TASKS.find((t) => t.id === id);
      if (task) task.status = status;
    });
    return { updated: taskIds.length };
  },
};
