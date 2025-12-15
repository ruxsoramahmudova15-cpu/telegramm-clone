import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';

interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  timestamp: number;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem('messageQueue');
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to load message queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem('messageQueue', JSON.stringify(queue));
  }, [queue]);

  const addToQueue = useCallback((message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    setQueue(prev => [...prev, queuedMessage]);
    return queuedMessage.id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(m => m.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing || !isOnline || queue.length === 0) return;

    setIsProcessing(true);
    const socket = getSocket();

    if (!socket?.connected) {
      setIsProcessing(false);
      return;
    }

    for (const message of queue) {
      try {
        socket.emit('message:send', {
          conversationId: message.conversationId,
          content: message.content,
          messageType: message.messageType
        });

        removeFromQueue(message.id);
      } catch (error) {
        console.error('Failed to send queued message:', error);

        if (message.retryCount >= MAX_RETRIES) {
          removeFromQueue(message.id);
        } else {
          setQueue(prev => prev.map(m => 
            m.id === message.id 
              ? { ...m, retryCount: m.retryCount + 1 }
              : m
          ));
        }
      }
    }

    setIsProcessing(false);
  }, [isOnline, isProcessing, queue, removeFromQueue]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const timer = setTimeout(processQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, processQueue]);

  return {
    isOnline,
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    processQueue
  };
};