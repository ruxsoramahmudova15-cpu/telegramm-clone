import axios from 'axios';
import { AuthResponse, Conversation, Message, User, UserSettings } from '../types';

// Production da environment variable dan oladi, development da /api ishlatadi
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  sendOTP: async (phone: string, displayName?: string): Promise<{ success: boolean; message: string; isNewUser?: boolean; errors?: string[] }> => {
    const response = await api.post('/auth/send-otp', { phone, displayName });
    return response.data;
  },

  verifyOTP: async (phone: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', { phone, code });
    return response.data;
  },

  logout: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  }
};

// Conversations API
export const conversationApi = {
  getAll: async (): Promise<{ success: boolean; conversations: Conversation[] }> => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getMessages: async (conversationId: string, limit?: number, before?: string): Promise<{ success: boolean; messages: Message[] }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    const response = await api.get(`/conversations/${conversationId}/messages?${params}`);
    return response.data;
  },

  create: async (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string }): Promise<{ success: boolean; conversation: Conversation }> => {
    const response = await api.post('/conversations', data);
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/conversations/${conversationId}/read`);
  }
};

// Users API
export const userApi = {
  search: async (query: string): Promise<{ success: boolean; users: User[] }> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getById: async (userId: string): Promise<{ success: boolean; user: User }> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (data: { displayName?: string; username?: string; profilePicture?: string; bio?: string }): Promise<{ success: boolean; user: User }> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  }
};

// Chat API
export const chatApi = {
  create: async (participantId: string, type: 'direct' | 'group' = 'direct', name?: string): Promise<{ success: boolean; chat: any; isExisting?: boolean }> => {
    const response = await api.post('/chat/create', { participantId, type, name });
    return response.data;
  },

  getMyChats: async (): Promise<{ success: boolean; chats: any[] }> => {
    const response = await api.get('/chat/my');
    return response.data;
  },

  getChat: async (chatId: string): Promise<{ success: boolean; chat: any }> => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },

  getMessages: async (chatId: string, limit?: number, before?: string): Promise<{ success: boolean; messages: Message[] }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    const response = await api.get(`/chat/${chatId}/messages?${params}`);
    return response.data;
  }
};

// Group API
export const groupApi = {
  create: async (data: { name: string; participantIds: string[]; description?: string; picture?: string }): Promise<{ success: boolean; group: any }> => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  get: async (groupId: string): Promise<{ success: boolean; group: any }> => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  update: async (groupId: string, data: { name?: string; description?: string; picture?: string }): Promise<{ success: boolean; group: any }> => {
    const response = await api.put(`/groups/${groupId}`, data);
    return response.data;
  },

  addMember: async (groupId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },

  removeMember: async (groupId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  leave: async (groupId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  makeAdmin: async (groupId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/groups/${groupId}/admins`, { userId });
    return response.data;
  },

  removeAdmin: async (groupId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/groups/${groupId}/admins/${userId}`);
    return response.data;
  }
};

// Notification API
export const notificationApi = {
  getAll: async (limit = 50, unreadOnly = false): Promise<{ success: boolean; notifications: any[] }> => {
    const response = await api.get(`/notifications?limit=${limit}&unreadOnly=${unreadOnly}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.get('/notifications/count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (notificationId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};

// Settings API
export const settingsApi = {
  get: async (): Promise<{ success: boolean; settings: UserSettings }> => {
    const response = await api.get('/settings');
    return response.data;
  },

  update: async (settings: Partial<UserSettings>): Promise<{ success: boolean; settings: UserSettings }> => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  updatePrivacy: async (privacy: {
    lastSeenVisibility?: 'everyone' | 'contacts' | 'nobody';
    profilePhotoVisibility?: 'everyone' | 'contacts' | 'nobody';
    onlineStatusVisibility?: 'everyone' | 'contacts' | 'nobody';
    readReceipts?: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/settings/privacy', privacy);
    return response.data;
  },

  updateNotifications: async (notifications: {
    messageNotifications?: boolean;
    groupNotifications?: boolean;
    notificationSound?: boolean;
    notificationPreview?: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/settings/notifications', notifications);
    return response.data;
  },

  updateTheme: async (theme: {
    theme?: 'light' | 'dark' | 'system';
    chatBackground?: string;
    accentColor?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/settings/theme', theme);
    return response.data;
  }
};

// Get API URL for file uploads
export const getApiUrl = () => API_URL || window.location.origin;

export default api;
