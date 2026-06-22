import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../config/env.js';

export const errorHandler = (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void => {
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
