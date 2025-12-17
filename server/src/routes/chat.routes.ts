import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { Conversation, Message, User } from '../models';
import { mockDb } from '../config/database';
import mongoose from 'mongoose';

const router = Router();
const isMockMode = () => process.env.USE_MOCK === 'true';

// POST /api/chat/create - Create new chat
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantId, type = 'direct', name } = req.body;

    if (!participantId) {
      res.status(400).json({ success: false, message: 'participantId talab qilinadi' });
      return;
    }

    const currentUserId = req.user!.userId;

    if (isMockMode()) {
      // Mock mode
      const chatId = `chat_${Date.now()}`;
      const chat = {
        id: chatId,
        type,
        name,
        participants: [currentUserId, participantId],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDb.conversations.set(chatId, chat);
      res.status(201).json({ success: true, chat });
      return;
    }

    // Check if direct chat already exists
    if (type === 'direct') {
      const existingChat = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [currentUserId, participantId], $size: 2 }
      }).populate('participants', 'displayName username profilePicture isOnline lastSeen');

      if (existingChat) {
        const otherParticipant = (existingChat.participants as any[]).find(
          (p: any) => p._id.toString() !== currentUserId
        );
        res.json({
          success: true,
          chat: {
            id: existingChat._id.toString(),
            type: existingChat.type,
            name: otherParticipant?.displayName || name,
            participants: existingChat.participants,
            createdAt: existingChat.createdAt,
            updatedAt: existingChat.updatedAt
          },
          isExisting: true
        });
        return;
      }
    }

    // Create new chat
    const newChat: any = await Conversation.create({
      type,
      name,
      participants: [currentUserId, participantId],
      admins: type === 'group' ? [currentUserId] : []
    } as any);

    await newChat.populate('participants', 'displayName username profilePicture isOnline lastSeen');

    const otherParticipant = (newChat.participants as any[]).find(
      (p: any) => p._id.toString() !== currentUserId
    );

    res.status(201).json({
      success: true,
      chat: {
        id: newChat._id.toString(),
        type: newChat.type,
        name: type === 'direct' ? otherParticipant?.displayName : name,
        participants: newChat.participants,
        createdAt: newChat.createdAt,
        updatedAt: newChat.updatedAt
      }
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/chat/my - Get user's chats
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.userId;

    if (isMockMode()) {
      const chats: any[] = [];
      for (const chat of mockDb.conversations.values()) {
        if (chat.participants.includes(currentUserId)) {
          chats.push(chat);
        }
      }
      res.json({ success: true, chats });
      return;
    }

    const chats = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'displayName username profilePicture isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'displayName' }
      })
      .sort({ updatedAt: -1 });

    const formattedChats = chats.map(chat => {
      const otherParticipant = chat.type === 'direct'
        ? (chat.participants as any[]).find((p: any) => p._id.toString() !== currentUserId)
        : null;

      return {
        id: chat._id.toString(),
        type: chat.type,
        name: chat.type === 'direct' ? otherParticipant?.displayName : chat.name,
        picture: chat.type === 'direct' ? otherParticipant?.profilePicture : null,
        participants: chat.participants,
        lastMessage: chat.lastMessage ? {
          id: (chat.lastMessage as any)._id.toString(),
          content: (chat.lastMessage as any).content,
          senderId: (chat.lastMessage as any).senderId?._id?.toString(),
          senderName: (chat.lastMessage as any).senderId?.displayName,
          createdAt: (chat.lastMessage as any).createdAt
        } : null,
        isOnline: chat.type === 'direct' ? otherParticipant?.isOnline : false,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    });

    res.json({ success: true, chats: formattedChats });
  } catch (error) {
    console.error('Get my chats error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/chat/:id - Get single chat
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    if (isMockMode()) {
      const chat = mockDb.conversations.get(id);
      if (!chat || !chat.participants.includes(currentUserId)) {
        res.status(404).json({ success: false, message: 'Chat topilmadi' });
        return;
      }
      res.json({ success: true, chat });
      return;
    }

    const chat = await Conversation.findOne({
      _id: id,
      participants: currentUserId
    }).populate('participants', 'displayName username profilePicture isOnline lastSeen');

    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat topilmadi' });
      return;
    }

    const otherParticipant = chat.type === 'direct'
      ? (chat.participants as any[]).find((p: any) => p._id.toString() !== currentUserId)
      : null;

    res.json({
      success: true,
      chat: {
        id: chat._id.toString(),
        type: chat.type,
        name: chat.type === 'direct' ? otherParticipant?.displayName : chat.name,
        participants: chat.participants,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/chat/:id/messages - Get chat messages
router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    const currentUserId = req.user!.userId;

    if (isMockMode()) {
      const messages: any[] = [];
      for (const msg of mockDb.messages.values()) {
        if (msg.conversationId === id) {
          messages.push(msg);
        }
      }
      res.json({ success: true, messages: messages.slice(-Number(limit)) });
      return;
    }

    // Verify user is participant
    const chat = await Conversation.findOne({ _id: id, participants: currentUserId });
    if (!chat) {
      res.status(403).json({ success: false, message: 'Bu chatga kirish huquqingiz yo\'q' });
      return;
    }

    const query: any = { conversationId: id };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'displayName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const formattedMessages = messages.reverse().map(msg => ({
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: (msg.senderId as any)?._id?.toString(),
      sender: msg.senderId ? {
        id: (msg.senderId as any)._id.toString(),
        displayName: (msg.senderId as any).displayName,
        username: (msg.senderId as any).username,
        profilePicture: (msg.senderId as any).profilePicture
      } : null,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt
    }));

    res.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
