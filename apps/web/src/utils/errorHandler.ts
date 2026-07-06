import { isAxiosError } from 'axios';

/**
 * Extracts a plain-language message from an API failure. The backend's
 * standard error shape is `{ success: false, error: { code, message } }`
 * nested under axios's `error.response.data` — never the raw axios/network
 * error, so callers never see technical details (status codes, stack
 * traces). Mirrors apps/mobile/src/utils/errorHandler.ts's getErrorMessage.
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
