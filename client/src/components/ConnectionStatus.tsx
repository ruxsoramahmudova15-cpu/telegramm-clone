import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { isConnected: isSocketConnected, socket } = useSocket();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReconnecting = () => setIsReconnecting(true);
    const handleConnect = () => setIsReconnecting(false);

    socket.on('reconnecting', handleReconnecting);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('reconnecting', handleReconnecting);
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  // Don't show anything if everything is fine
  if (isOnline && isSocketConnected) return null;

  return (
    <div className={`
      fixed bottom-4 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-4 py-2 rounded-full
      ${!isOnline 
        ? 'bg-telegram-error text-white' 
        : isReconnecting 
          ? 'bg-telegram-warning text-white'
          : 'bg-telegram-bg-lighter text-telegram-text-secondary'
      }
      shadow-lg transition-all duration-300
    `}>
      {!isOnline ? (
        <>
          <WifiOff size={18} />
          <span className="text-sm font-medium">Internet aloqasi yo'q</span>
        </>
      ) : isReconnecting ? (
        <>
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm font-medium">Qayta ulanmoqda...</span>
        </>
      ) : (
        <>
          <Wifi size={18} />
          <span className="text-sm font-medium">Serverga ulanmoqda...</span>
        </>
      )}
    </div>
  );
};