import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    // Don't show notification if page is focused
    if (document.hasFocus()) return;

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/telegram.svg',
      tag: options.tag,
      silent: false
    });

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }, [isSupported, permission]);

  const updateTabBadge = useCallback((count: number) => {
    const baseTitle = 'Telegram Clone';
    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    updateTabBadge
  };
};