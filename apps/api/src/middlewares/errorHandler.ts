import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

import { env } from '../config/env.js';

export const errorHandler = (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void => {
  // Prisma errors carry no `statusCode`, so left unhandled they'd fall
  // through to the generic 500 branch below and leak internal details
  // (table/constraint names) in non-production. Translate the common ones
  // to standard ApiError shapes instead.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.['target'] as string[] | undefined)?.join(', ') ?? 'field';
      void reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: `A record with this ${target} already exists` },
      });
      return;
    }
    if (error.code === 'P2025') {
      void reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      });
      return;
    }
  }

  const statusCode = error.statusCode ?? 500;

  if (statusCode === 400) {
    void reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
    return;
  }

  if (statusCode >= 500) {
    console.error(error);
    void reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      },
    });
    return;
  }

  void reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code ?? 'ERROR',
      message: error.message,
    },
  });
};
