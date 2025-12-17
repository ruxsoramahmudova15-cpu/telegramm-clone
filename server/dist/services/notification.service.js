"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const models_1 = require("../models");
const mongoose_1 = __importDefault(require("mongoose"));
const USE_MOCK = process.env.USE_MOCK === 'true';
// Mock storage for notifications
const mockNotifications = new Map();
class NotificationService {
    async createNotification(userId, type, title, body, data) {
        if (USE_MOCK) {
            const id = new mongoose_1.default.Types.ObjectId().toString();
            const notification = {
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
        const notification = await models_1.Notification.create({
            userId,
            type,
            title,
            body,
            data,
            isRead: false
        });
        return this.formatNotification(notification);
    }
    async getUserNotifications(userId, limit = 50, unreadOnly = false) {
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
        const query = { userId };
        if (unreadOnly) {
            query.isRead = false;
        }
        const notifications = await models_1.Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);
        return notifications.map(n => this.formatNotification(n));
    }
    async getUnreadCount(userId) {
        if (USE_MOCK) {
            return Array.from(mockNotifications.values())
                .filter(n => n.userId === userId && !n.isRead)
                .length;
        }
        return await models_1.Notification.countDocuments({ userId, isRead: false });
    }
    async markAsRead(notificationId, userId) {
        if (USE_MOCK) {
            const notification = mockNotifications.get(notificationId);
            if (notification && notification.userId === userId) {
                notification.isRead = true;
                return true;
            }
            return false;
        }
        const result = await models_1.Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true });
        return !!result;
    }
    async markAllAsRead(userId) {
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
        const result = await models_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
        return result.modifiedCount;
    }
    async deleteNotification(notificationId, userId) {
        if (USE_MOCK) {
            const notification = mockNotifications.get(notificationId);
            if (notification && notification.userId === userId) {
                mockNotifications.delete(notificationId);
                return true;
            }
            return false;
        }
        const result = await models_1.Notification.findOneAndDelete({ _id: notificationId, userId });
        return !!result;
    }
    formatNotification(notification) {
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
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
