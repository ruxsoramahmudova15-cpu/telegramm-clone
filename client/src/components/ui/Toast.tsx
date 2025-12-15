import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
};

const colors = {
  success: 'bg-telegram-success/10 border-telegram-success text-telegram-success',
  error: 'bg-telegram-error/10 border-telegram-error text-telegram-error',
  info: 'bg-telegram-blue/10 border-telegram-blue text-telegram-blue',
  warning: 'bg-telegram-warning/10 border-telegram-warning text-telegram-warning'
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border
        ${colors[type]}
        transition-all duration-300 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <Icon size={20} />
      <p className="flex-1 text-sm font-medium text-telegram-text">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Toast Container
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Toast Hook
let toastId = 0;
const listeners: Set<(toast: ToastItem) => void> = new Set();

export const toast = {
  success: (message: string) => {
    const id = `toast-${++toastId}`;
    listeners.forEach(listener => listener({ id, type: 'success', message }));
  },
  error: (message: string) => {
    const id = `toast-${++toastId}`;
    listeners.forEach(listener => listener({ id, type: 'error', message }));
  },
  info: (message: string) => {
    const id = `toast-${++toastId}`;
    listeners.forEach(listener => listener({ id, type: 'info', message }));
  },
  warning: (message: string) => {
    const id = `toast-${++toastId}`;
    listeners.forEach(listener => listener({ id, type: 'warning', message }));
  }
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (toast: ToastItem) => {
      setToasts(prev => [...prev, toast]);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, removeToast };
};