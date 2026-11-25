export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export function inferToastType(message: string): ToastType {
  const lower = message.toLowerCase();
  if (
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('invalid') ||
    lower.includes('exceeds') ||
    lower.includes('denied') ||
    lower.includes('not supported') ||
    lower.includes('please enter') ||
    lower.includes('please select') ||
    lower.includes('required')
  ) {
    return 'error';
  }
  if (
    lower.includes('success') ||
    lower.includes('dispatched') ||
    lower.includes('updated') ||
    lower.includes('sent') ||
    lower.includes('saved') ||
    lower.includes('extended') ||
    lower.includes('reassigned') ||
    lower.includes('converted') ||
    lower.includes('complete')
  ) {
    return 'success';
  }
  if (lower.includes('notice') || lower.includes('offline') || lower.includes('allow')) {
    return 'warning';
  }
  return 'info';
}

export function showToast(message: string, type?: ToastType): void {
  if (typeof window === 'undefined') return;
  const resolvedType = type || inferToastType(message);
  window.dispatchEvent(
    new CustomEvent('faculty-toast', {
      detail: {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        type: resolvedType,
      },
    })
  );
}
