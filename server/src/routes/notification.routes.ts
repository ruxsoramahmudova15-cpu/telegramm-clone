import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', unreadOnly = 'false' } = req.query;
    const notifications = await notificationService.getUserNotifications(
      req.user!.userId,
      parseInt(limit as string),
      unreadOnly === 'true'
    );
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/notifications/count - Get unread count
router.get('/count', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await notificationService.markAsRead(id, req.user!.userId);
    res.json({ success });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await notificationService.markAllAsRead(req.user!.userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await notificationService.deleteNotification(id, req.user!.userId);
    res.json({ success });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
