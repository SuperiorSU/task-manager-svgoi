import type { ApiError } from '@godigitify/types';

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) return error.error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ApiError).success === false
  );
};

export const getFieldErrors = (error: unknown): Record<string, string[]> => {
  if (isApiError(error)) return error.error.details ?? {};
  return {};
};
