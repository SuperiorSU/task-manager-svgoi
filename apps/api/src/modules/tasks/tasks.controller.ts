import type { FastifyReply, FastifyRequest } from 'fastify';

import { sendSuccess } from '../../utils/response.utils.js';
import { tasksService } from './tasks.service.js';

export const tasksController = {
  async getList(request: FastifyRequest, reply: FastifyReply) {
    const { user } = request;
    const result = await tasksService.getList({
      ...(request.query as object),
      viewerRole: user.role,
      ...(user.departmentId ? { viewerDeptId: user.departmentId } : {}),
      viewerId: user.id,
    });
    return sendSuccess(reply, result.tasks, 200, result.meta);
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const task = await tasksService.getById(
      id,
      request.user.id,
      request.user.role,
      request.user.departmentId
    );
    return sendSuccess(reply, task);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const task = await tasksService.create({
      ...(request.body as object),
      creatorId: request.user.id,
    } as never);
    return sendSuccess(reply, task, 201);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const task = await tasksService.update(
      id,
      request.body as never,
      request.user.id,
      request.user.role,
      request.user.departmentId
    );
    return sendSuccess(reply, task);
  },

  async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { status, comment } = request.body as { status: string; comment?: string };
    const task = await tasksService.updateStatus(
      id,
      status as never,
      request.user.id,
      request.user.role,
      comment
    );
    return sendSuccess(reply, task);
  },

  async assign(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { assigneeId } = request.body as { assigneeId: string };
    const task = await tasksService.assign(id, assigneeId, request.user.id);
    return sendSuccess(reply, task);
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await tasksService.softDelete(id, request.user.id);
    return sendSuccess(reply, null);
  },

  async bulkStatus(request: FastifyRequest, reply: FastifyReply) {
    const { ids, status } = request.body as { ids: string[]; status: string };
    await tasksService.bulkUpdateStatus(ids, status as never, request.user.id);
    return sendSuccess(reply, null);
  },

  async getComments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const comments = await tasksService.getComments(
      id,
      request.user.id,
      request.user.role,
      request.user.departmentId
    );
    return sendSuccess(reply, comments);
  },

  async addComment(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { content, parentId } = request.body as { content: string; parentId?: string };
    const comment = await tasksService.addComment(
      id,
      request.user.id,
      content,
      parentId,
      request.user.role,
      request.user.departmentId
    );
    return sendSuccess(reply, comment, 201);
  },

  async getActivity(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const activity = await tasksService.getActivity(
      id,
      request.user.id,
      request.user.role,
      request.user.departmentId
    );
    return sendSuccess(reply, activity);
  },
};
