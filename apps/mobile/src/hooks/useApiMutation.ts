import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';

import { useToast } from './useToast';
import { getErrorMessage } from '../utils/errorHandler';

type ApiMutationOptions<TData, TVariables, TContext> = UseMutationOptions<
  TData,
  unknown,
  TVariables,
  TContext
> & {
  /** Shown as a success toast when the mutation resolves. Omit for silent success (e.g. navigation is the feedback). */
  successMessage?: string;
};

/**
 * Thin wrapper around React Query's `useMutation` that adds a global success
 * toast and a global error toast (via useToast/components/ui/Toast.tsx) to
 * every mutation, without touching each call site. Error messages always go
 * through getErrorMessage — plain-language ApiError text when the backend
 * sent one, a generic fallback otherwise; never raw network/parse errors.
 * Any `onSuccess`/`onError` passed in still runs — this only adds the toast.
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: ApiMutationOptions<TData, TVariables, TContext>
): UseMutationResult<TData, unknown, TVariables, TContext> {
  const toast = useToast();
  const { successMessage, onSuccess, onError, ...rest } = options;

  return useMutation({
    ...rest,
    onSuccess: (...args) => {
      if (successMessage) toast.success(successMessage);
      return onSuccess?.(...args);
    },
    onError: (...args) => {
      toast.error(getErrorMessage(args[0]));
      return onError?.(...args);
    },
  });
}
