import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface OnlineUser {
  id: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface TypingInfo {
  conversationId: string;
  userId: string;
  username?: string;
  isTyping: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Map<string, OnlineUser>;
  typingUsers: Map<string, TypingInfo[]>;
  isUserOnline: (userId: string) => boolean;
  getUserLastSeen: (userId: string) => string | undefined;
  requestUserStatus: (userId: string) => void;
  getTypingUsers: (conversationId: string) => TypingInfo[];
  emitTyping: (conversationId: string, isTyping: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Production da environment variable dan oladi, development da localhost ishlatadi
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingInfo[]>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket ulandi, socket.id:', newSocket.id);
      setIsConnected(true);
      
      // Request initial online users list
      newSocket.emit('users:online:request');
    });
    
    // Receive initial online users list
    newSocket.on('users:online:list', (users: { userId: string; lastSeen: string }[]) => {
      console.log('👥 Online users received:', users.length);
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        users.forEach(u => {
          updated.set(u.userId, {
            id: u.userId,
            isOnline: true,
            lastSeen: u.lastSeen
          });
        });
        return updated;
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket uzildi:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket xatosi:', error.message);
      setIsConnected(false);
    });

    // User status updates
    newSocket.on('user:status', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      console.log('👤 User status update:', data.userId, data.isOnline ? 'online' : 'offline');
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          id: data.userId,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen || new Date().toISOString()
        });
        return updated;
      });
    });

    // Messages seen updates
    newSocket.on('messages:seen', (data: { conversationId: string; userId: string; messageIds: string[] }) => {
      console.log('👁️ Messages seen:', data.messageIds.length, 'messages by', data.userId);
    });

    // Typing updates
    newSocket.on('typing:update', (data: TypingInfo) => {
      setTypingUsers(prev => {
        const updated = new Map(prev);
        const conversationTyping = updated.get(data.conversationId) || [];
        
        // Remove existing entry for this user
        const filtered = conversationTyping.filter(t => t.userId !== data.userId);
        
        if (data.isTyping) {
          filtered.push(data);
        }
        
        if (filtered.length > 0) {
          updated.set(data.conversationId, filtered);
        } else {
          updated.delete(data.conversationId);
        }
        
        return updated;
      });

      // Auto-remove typing after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Map(prev);
            const conversationTyping = updated.get(data.conversationId) || [];
            const filtered = conversationTyping.filter(t => t.userId !== data.userId);
            
            if (filtered.length > 0) {
              updated.set(data.conversationId, filtered);
            } else {
              updated.delete(data.conversationId);
            }
            
            return updated;
          });
        }, 3000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.get(userId)?.isOnline || false;
  }, [onlineUsers]);

  const getUserLastSeen = useCallback((userId: string): string | undefined => {
    return onlineUsers.get(userId)?.lastSeen;
  }, [onlineUsers]);

  const requestUserStatus = useCallback((userId: string) => {
    if (socket && isConnected) {
      socket.emit('user:status:request', { userId });
    }
  }, [socket, isConnected]);

  const getTypingUsers = useCallback((conversationId: string): TypingInfo[] => {
    return typingUsers.get(conversationId) || [];
  }, [typingUsers]);

  const emitTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
    }
  }, [socket, isConnected]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('conversation:join', { conversationId });
    }
  }, [socket, isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('conversation:leave', { conversationId });
    }
  }, [socket, isConnected]);

  // Listen for user status responses
  useEffect(() => {
    if (!socket) return;
    
    const handleStatusResponse = (data: { userId: string; isOnline: boolean; lastSeen: string | null }) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          id: data.userId,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen || undefined
        });
        return updated;
      });
    };
    
    socket.on('user:status:response', handleStatusResponse);
    
    return () => {
      socket.off('user:status:response', handleStatusResponse);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onlineUsers,
      typingUsers,
      isUserOnline,
      getUserLastSeen,
      requestUserStatus,
      getTypingUsers,
      emitTyping,
      joinConversation,
      leaveConversation
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
