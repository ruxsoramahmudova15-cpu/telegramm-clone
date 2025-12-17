"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
// GET /api/notifications - Get user notifications
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { limit = '50', unreadOnly = 'false' } = req.query;
        const notifications = await notification_service_1.notificationService.getUserNotifications(req.user.userId, parseInt(limit), unreadOnly === 'true');
        res.json({ success: true, notifications });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// GET /api/notifications/count - Get unread count
router.get('/count', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const count = await notification_service_1.notificationService.getUnreadCount(req.user.userId);
        res.json({ success: true, count });
    }
    catch (error) {
        console.error('Get notification count error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await notification_service_1.notificationService.markAsRead(id, req.user.userId);
        res.json({ success });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const count = await notification_service_1.notificationService.markAllAsRead(req.user.userId);
        res.json({ success: true, count });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await notification_service_1.notificationService.deleteNotification(id, req.user.userId);
        res.json({ success });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
