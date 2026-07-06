import { useToastStore } from '../stores/toast.store';

/** Global success/error/info toast — see components/ui/Toast.tsx for the renderer. */
export const useToast = () => {
  const show = useToastStore((s) => s.show);
  return {
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    info: (message: string) => show('info', message),
  };
};
