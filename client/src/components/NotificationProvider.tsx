import React, { useEffect, createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { Message } from '../types';

interface NotificationContextType {
  requestPermission: () => Promise<boolean>;
  permission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { 
    permission, 
    requestPermission, 
    showNotification, 
    updateTabBadge 
  } = useNotifications();

  // Request permission on mount
  useEffect(() => {
    if (user && permission === 'default') {
      requestPermission();
    }
  }, [user, permission, requestPermission]);

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    let unreadCount = 0;

    const handleNewMessage = (message: Message) => {
      // Don't notify for own messages
      if (message.senderId === user.id) return;

      // Update tab badge
      unreadCount++;
      updateTabBadge(unreadCount);

      // Show browser notification
      showNotification({
        title: message.sender?.displayName || 'Yangi xabar',
        body: message.content.length > 100 
          ? message.content.substring(0, 100) + '...' 
          : message.content,
        tag: `message-${message.conversationId}`,
        onClick: () => {
          // Focus will be handled by notification click
        }
      });
    };

    socket.on('message:new', handleNewMessage);

    // Reset badge when window is focused
    const handleFocus = () => {
      unreadCount = 0;
      updateTabBadge(0);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      socket.off('message:new', handleNewMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, showNotification, updateTabBadge]);

  return (
    <NotificationContext.Provider value={{ requestPermission, permission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};