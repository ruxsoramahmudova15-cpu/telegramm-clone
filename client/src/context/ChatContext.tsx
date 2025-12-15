import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Conversation, Message, TypingUser } from '../types';
import { conversationApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingUser[];
  isLoading: boolean;
  totalUnreadCount: number;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'voice' | 'video') => void;
  sendImageMessage: (imageUrl: string, fileName: string) => void;
  sendVideoMessage: (videoUrl: string, fileName: string) => void;
  sendMediaMessage: (mediaUrl: string, fileName: string, type: 'image' | 'video') => void;
  startTyping: () => void;
  stopTyping: () => void;
  createConversation: (type: 'direct' | 'group', participantIds: string[], name?: string) => Promise<Conversation | null>;
  refreshConversations: () => Promise<void>;
  clearChat: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  // Update document title with unread count
  useEffect(() => {
    if (totalUnreadCount > 0) {
      document.title = `(${totalUnreadCount}) Telegram`;
    } else {
      document.title = 'Telegram';
    }
  }, [totalUnreadCount]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: Message) => {
      // Add message to current conversation
      if (activeConversation?.id === message.conversationId) {
        setMessages(prev => [...prev, message]);
      }

      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: activeConversation?.id === conv.id ? 0 : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    const handleTypingUpdate = (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => !(t.conversationId === data.conversationId && t.userId === data.userId));
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    };

    const handleNewConversation = (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev]);
    };

    const handleMessagesSeen = (data: { conversationId: string; userId: string; messageIds: string[] }) => {
      console.log('📬 Received messages:seen event:', {
        conversationId: data.conversationId,
        userId: data.userId,
        messageCount: data.messageIds.length,
        messageIds: data.messageIds
      });
      // Har qanday conversationdagi xabarlarni yangilash
      setMessages(prev => {
        console.log('📝 Current messages count:', prev.length);
        const updated = prev.map(msg => {
          if (data.messageIds.includes(msg.id)) {
            console.log('✅ Updating message status to seen:', msg.id, 'old status:', msg.status);
            return { ...msg, status: 'seen' as const, readBy: [...(msg.readBy || []), data.userId] };
          }
          return msg;
        });
        return updated;
      });
    };

    const handleNotification = (notification: any) => {
      console.log('🔔 New notification:', notification);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        const browserNotif = new Notification(notification.title, {
          body: notification.body,
          icon: '/telegram.svg',
          tag: notification.id,
          silent: false
        });
        
        browserNotif.onclick = () => {
          window.focus();
          if (notification.data?.conversationId) {
            // Find and set the conversation
            const conv = conversations.find(c => c.id === notification.data.conversationId);
            if (conv) {
              setActiveConversation(conv);
            }
          }
          browserNotif.close();
        };
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('conversation:new', handleNewConversation);
    socket.on('messages:seen', handleMessagesSeen);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('conversation:new', handleNewConversation);
      socket.off('messages:seen', handleMessagesSeen);
      socket.off('notification:new', handleNotification);
    };
  }, [socket, isConnected, activeConversation?.id, conversations]);

  // Load conversations
  const refreshConversations = useCallback(async () => {
    try {
      const response = await conversationApi.getAll();
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshConversations();
    }
  }, [token, refreshConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await conversationApi.getMessages(activeConversation.id);
        if (response.success) {
          setMessages(response.messages);
        }
        
        // Mark as read via API
        await conversationApi.markAsRead(activeConversation.id);
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation.id ? { ...conv, unreadCount: 0 } : conv
        ));
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [activeConversation?.id]);

  // Join conversation and mark messages as read via socket
  useEffect(() => {
    if (!socket || !isConnected || !activeConversation) return;

    console.log('🚪 Joining conversation:', activeConversation.id);
    socket.emit('conversation:join', { conversationId: activeConversation.id });
    
    console.log('📖 Marking messages as read in conversation:', activeConversation.id);
    socket.emit('messages:read', { conversationId: activeConversation.id });
  }, [socket, isConnected, activeConversation?.id]);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' | 'voice' | 'video' = 'text') => {
    if (!activeConversation || !content.trim() || !socket) return;

    socket.emit('message:send', {
      conversationId: activeConversation.id,
      content: content.trim(),
      type
    });
  }, [activeConversation, socket]);

  const sendImageMessage = useCallback((imageUrl: string, _fileName: string) => {
    if (!activeConversation || !socket) return;

    socket.emit('message:send', {
      conversationId: activeConversation.id,
      content: imageUrl,
      type: 'image'
    });
  }, [activeConversation, socket]);

  const sendVideoMessage = useCallback((videoUrl: string, _fileName: string) => {
    if (!activeConversation || !socket) return;

    socket.emit('message:send', {
      conversationId: activeConversation.id,
      content: videoUrl,
      type: 'video'
    });
  }, [activeConversation, socket]);

  const sendMediaMessage = useCallback((mediaUrl: string, _fileName: string, type: 'image' | 'video') => {
    if (!activeConversation || !socket) return;

    socket.emit('message:send', {
      conversationId: activeConversation.id,
      content: mediaUrl,
      type
    });
  }, [activeConversation, socket]);

  const startTyping = useCallback(() => {
    if (!activeConversation || !socket) return;
    socket.emit('typing:start', { conversationId: activeConversation.id });
  }, [activeConversation, socket]);

  const stopTyping = useCallback(() => {
    if (!activeConversation || !socket) return;
    socket.emit('typing:stop', { conversationId: activeConversation.id });
  }, [activeConversation, socket]);

  const createConversation = useCallback(async (
    type: 'direct' | 'group',
    participantIds: string[],
    name?: string
  ): Promise<Conversation | null> => {
    try {
      const response = await conversationApi.create({ type, participantIds, name });
      if (response.success) {
        await refreshConversations();
        return response.conversation;
      }
      return null;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  }, [refreshConversations]);

  const clearChat = useCallback((conversationId: string) => {
    if (activeConversation?.id === conversationId) {
      setMessages([]);
    }
    // TODO: Call API to clear messages on server
  }, [activeConversation?.id]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      messages,
      typingUsers,
      isLoading,
      totalUnreadCount,
      setActiveConversation,
      sendMessage,
      sendImageMessage,
      sendVideoMessage,
      sendMediaMessage,
      startTyping,
      stopTyping,
      createConversation,
      refreshConversations,
      clearChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};