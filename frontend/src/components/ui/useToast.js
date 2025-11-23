import { useToastContext } from './ToastProvider';
export function useToast() {
    const { showToast, dismiss } = useToastContext();
    return { showToast, dismiss };
}
