import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

interface OnlineIndicatorProps {
  userId: string;
  showDot?: boolean;
  showText?: boolean;
  lastSeen?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Format last seen time in Uzbek
const formatLastSeen = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Just now (less than 1 minute)
    if (diffMin < 1) {
      return 'hozirgina';
    }
    
    // Minutes ago
    if (diffMin < 60) {
      return `${diffMin} daqiqa oldin`;
    }
    
    // Hours ago (same day)
    if (diffHour < 24 && date.getDate() === now.getDate()) {
      return `bugun ${date.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
      return `kecha ${date.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // This week (less than 7 days)
    if (diffDay < 7) {
      const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      return `${weekdays[date.getDay()]} ${date.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // This year
    if (date.getFullYear() === now.getFullYear()) {
      const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    }
    
    // Different year
    return date.toLocaleDateString('uz', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  userId,
  showDot = true,
  showText = false,
  lastSeen: propLastSeen,
  size = 'md',
  className = ''
}) => {
  const { isUserOnline, onlineUsers } = useSocket();
  const isOnline = isUserOnline(userId);
  const userInfo = onlineUsers.get(userId);
  const lastSeen = userInfo?.lastSeen || propLastSeen;

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (showText) {
    const lastSeenText = formatLastSeen(lastSeen);
    return (
      <span className={`text-[13px] ${isOnline ? 'text-[#5ca0d3]' : 'text-[#6c7883]'} ${className}`}>
        {isOnline ? 'online' : lastSeenText ? `oxirgi: ${lastSeenText}` : 'offline'}
      </span>
    );
  }

  if (showDot) {
    return (
      <div 
        className={`${dotSizes[size]} rounded-full ${isOnline ? 'bg-[#4dcd5e]' : 'bg-[#6c7883]'} ${className}`}
        title={isOnline ? 'Online' : lastSeen ? `Oxirgi: ${formatLastSeen(lastSeen)}` : 'Offline'}
      />
    );
  }

  return null;
};

// Online dot for avatar - shows green dot only when online
export const OnlineDot: React.FC<{ userId: string; className?: string }> = ({ userId, className = '' }) => {
  const { isUserOnline } = useSocket();
  const isOnline = isUserOnline(userId);

  if (!isOnline) return null;

  return (
    <div className={`absolute bottom-0 right-0 w-[14px] h-[14px] bg-[#4dcd5e] rounded-full border-2 border-[#17212b] ${className}`} />
  );
};

// Full status badge with online/offline and last seen
export const StatusBadge: React.FC<{
  userId: string;
  showLastSeen?: boolean;
  className?: string;
}> = ({ userId, showLastSeen = true, className = '' }) => {
  const { isUserOnline, onlineUsers } = useSocket();
  const isOnline = isUserOnline(userId);
  const userInfo = onlineUsers.get(userId);
  const lastSeen = userInfo?.lastSeen;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#4dcd5e]' : 'bg-[#6c7883]'}`} />
      <span className={`text-sm ${isOnline ? 'text-[#4dcd5e]' : 'text-[#6c7883]'}`}>
        {isOnline ? 'Online' : showLastSeen && lastSeen ? formatLastSeen(lastSeen) : 'Offline'}
      </span>
    </div>
  );
};

// Hook to get user status
export const useUserStatus = (userId: string) => {
  const { isUserOnline, onlineUsers } = useSocket();
  const [status, setStatus] = useState<{ isOnline: boolean; lastSeen?: string }>({
    isOnline: false,
    lastSeen: undefined
  });

  useEffect(() => {
    const isOnline = isUserOnline(userId);
    const userInfo = onlineUsers.get(userId);
    setStatus({
      isOnline,
      lastSeen: userInfo?.lastSeen
    });
  }, [userId, isUserOnline, onlineUsers]);

  return {
    ...status,
    formattedLastSeen: formatLastSeen(status.lastSeen)
  };
};

// Export formatLastSeen for use in other components
export { formatLastSeen };
