'use client';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export type NotificationPayload = {
  id?: string;
  message: string;
  severity: NotificationSeverity;
  duration?: number;
};

const EVENT_NAME = 'gtw:notification';

function emit(payload: NotificationPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<NotificationPayload>(EVENT_NAME, {
    detail: {
      duration: 5000,
      ...payload,
      id: payload.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
  }));
}

export function notifySuccess(message: string, duration = 5000) {
  emit({ message, severity: 'success', duration });
}

export function notifyError(message: string, duration = 5000) {
  emit({ message, severity: 'error', duration });
}

export function notifyWarning(message: string, duration = 5000) {
  emit({ message, severity: 'warning', duration });
}

export function notifyInfo(message: string, duration = 5000) {
  emit({ message, severity: 'info', duration });
}

export const notificationEventName = EVENT_NAME;
