export interface User {
  id: string;
  username: string;
  phone: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  lastSeen: string;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  errors?: string[];
}

export interface SendOTPData {
  phone: string;
  displayName?: string;
}

export interface VerifyOTPData {
  phone: string;
  code: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: 'text' | 'file' | 'image' | 'video' | 'voice' | 'system';
  type?: 'text' | 'file' | 'image' | 'video' | 'voice' | 'system'; // Backend sends 'type'
  replyToId?: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  status?: MessageStatus;
  readBy?: string[];
  sender?: {
    id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
  };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  picture?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  participants?: string[];
  admins?: string[];
  members?: GroupMember[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface GroupMember {
  id: string;
  displayName: string;
  username: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface TypingUser {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface UserSettings {
  // Privacy
  lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
  profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  onlineStatusVisibility: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  // Notifications
  messageNotifications: boolean;
  groupNotifications: boolean;
  notificationSound: boolean;
  notificationPreview: boolean;
  // Theme
  theme: 'light' | 'dark' | 'system';
  chatBackground: string;
  accentColor: string;
}