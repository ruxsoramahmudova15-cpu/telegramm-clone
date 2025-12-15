import { Notification } from '../models';
import { mockDb } from '../config/database';
import mongoose from 'mongoose';

const USE_MOCK = process.env.USE_MOCK === 'true';

interface NotificationData {
  id: string;
  userId: string;
  type: 'message' | 'group_invite' | 'mention' | 'system';
  title: string;
  body: string;
  data?: {
    conversationId?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

// Mock storage for notifications
const mockNotifications = new Map<string, NotificationData>();

export class NotificationService {
  async createNotification(
    userId: string,
    type: 'message' | 'group_invite' | 'mention' | 'system',
    title: string,
    body: string,
    data?: NotificationData['data']
  ): Promise<NotificationData> {
    if (USE_MOCK) {
      const id = new mongoose.Types.ObjectId().toString();
      const notification: NotificationData = {
        id,
        userId,
        type,
        title,
        body,
        data,
        isRead: false,
        createdAt: new Date()
      };
      mockNotifications.set(id, notification);
      return notification;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
      isRead: false
    });

    return this.formatNotification(notification);
  }

  async getUserNotifications(userId: string, limit = 50, unreadOnly = false): Promise<NotificationData[]> {
    if (USE_MOCK) {
      let notifications = Array.from(mockNotifications.values())
        .filter(n => n.userId === userId);
      
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.isRead);
      }
      
      return notifications
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }

    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications.map(n => this.formatNotification(n));
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (USE_MOCK) {
      return Array.from(mockNotifications.values())
        .filter(n => n.userId === userId && !n.isRead)
        .length;
    }

    return await Notification.countDocuments({ userId, isRead: false });
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    if (USE_MOCK) {
      const notification = mockNotifications.get(notificationId);
      if (notification && notification.userId === userId) {
        notification.isRead = true;
        return true;
      }
      return false;
    }

    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true }
    );
    return !!result;
  }

  async markAllAsRead(userId: string): Promise<number> {
    if (USE_MOCK) {
      let count = 0;
      mockNotifications.forEach(n => {
        if (n.userId === userId && !n.isRead) {
          n.isRead = true;
          count++;
        }
      });
      return count;
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    if (USE_MOCK) {
      const notification = mockNotifications.get(notificationId);
      if (notification && notification.userId === userId) {
        mockNotifications.delete(notificationId);
        return true;
      }
      return false;
    }

    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    return !!result;
  }

  private formatNotification(notification: any): NotificationData {
    return {
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt
    };
  }
}

export const notificationService = new NotificationService();
