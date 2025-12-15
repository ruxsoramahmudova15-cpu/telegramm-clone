import { Router, Response } from 'express';
import { messageService } from '../services/message.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/conversations - Get user's conversations
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await messageService.getUserConversations(req.user!.userId);
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

// GET /api/conversations/:id/messages - Get conversation messages
router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit, before } = req.query;

    const messages = await messageService.getConversationMessages(
      id,
      req.user!.userId,
      limit ? parseInt(limit as string) : 50,
      before as string
    );

    res.json({
      success: true,
      messages
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    if (error.message === 'User is not a participant of this conversation') {
      res.status(403).json({
        success: false,
        message: 'Bu suhbatga kirish huquqingiz yo\'q'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

// POST /api/conversations - Create new conversation
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, participantIds, name, description } = req.body;

    if (!type || !participantIds || !Array.isArray(participantIds)) {
      res.status(400).json({
        success: false,
        message: 'Type va participantIds talab qilinadi'
      });
      return;
    }

    // Ensure current user is in participants
    if (!participantIds.includes(req.user!.userId)) {
      participantIds.push(req.user!.userId);
    }

    const conversation = await messageService.createConversation(
      type,
      participantIds,
      req.user!.userId,
      name
    );

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

// POST /api/conversations/:id/read - Mark messages as read
router.post('/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await messageService.markMessagesAsRead(id, req.user!.userId);
    res.json({
      success: true,
      message: 'Xabarlar o\'qildi deb belgilandi'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

export default router;