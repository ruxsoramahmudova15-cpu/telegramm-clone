import { Conversation, Message, User } from '../models';
import { mockDb } from '../config/database';
import mongoose, { Types } from 'mongoose';

const USE_MOCK = process.env.USE_MOCK === 'true';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'voice' | 'video';
  replyToId?: string;
  createdAt: Date;
  status: MessageStatus;
  readBy: string[];
  sender?: { id: string; username: string; displayName: string; profilePicture?: string };
}

export interface ConversationData {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants?: string[];
  lastMessage?: MessageData;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MessageService {
  async createConversation(
    type: 'direct' | 'group',
    participantIds: string[],
    createdBy: string,
    name?: string
  ): Promise<ConversationData> {
    if (USE_MOCK) {
      const id = new mongoose.Types.ObjectId().toString();
      const conv = { id, type, name, participants: participantIds, admins: [createdBy], createdAt: new Date(), updatedAt: new Date() };
      mockDb.conversations.set(id, conv);
      return conv as ConversationData;
    }

    // Check existing direct conversation
    if (type === 'direct' && participantIds.length === 2) {
      const existing = await Conversation.findOne({
        type: 'direct',
        participants: { $all: participantIds, $size: 2 }
      });
      if (existing) return this.formatConversation(existing);
    }

    const conversation = await Conversation.create({
      type, 
      name, 
      participants: participantIds.map(id => new Types.ObjectId(id)), 
      admins: [new Types.ObjectId(createdBy)]
    });
    return this.formatConversation(conversation);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'file' | 'image' | 'voice' | 'video' = 'text',
    replyToId?: string
  ): Promise<MessageData> {
    if (USE_MOCK) {
      const id = new mongoose.Types.ObjectId().toString();
      const sender = mockDb.users.get(senderId);
      const msg = { id, conversationId, senderId, content, type, replyToId, createdAt: new Date(), readBy: [senderId], status: 'sent' as MessageStatus };
      mockDb.messages.set(id, msg);
      return { ...msg, sender: sender ? { id: sender.id, username: sender.username, displayName: sender.displayName } : undefined } as MessageData;
    }

    const message = await Message.create({ 
      conversationId: new Types.ObjectId(conversationId), 
      senderId: new Types.ObjectId(senderId), 
      content, 
      type, 
      replyTo: replyToId ? new Types.ObjectId(replyToId) : undefined, 
      readBy: [new Types.ObjectId(senderId)] 
    });
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: new Date() });
    
    const conv = await Conversation.findById(conversationId);
    const participantCount = conv?.participants?.length || 2;
    
    const sender = await User.findById(senderId);
    return this.formatMessage(message, sender, participantCount);
  }

  async getConversationMessages(conversationId: string, _userId: string, limit = 50): Promise<MessageData[]> {
    if (USE_MOCK) {
      const messages: MessageData[] = [];
      for (const msg of mockDb.messages.values()) {
        if (msg.conversationId === conversationId) {
          const sender = mockDb.users.get(msg.senderId);
          messages.push({ ...msg, sender: sender ? { id: sender.id, username: sender.username, displayName: sender.displayName } : undefined });
        }
      }
      return messages.slice(-limit);
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(limit).populate('senderId');
    const conv = await Conversation.findById(conversationId);
    const participantCount = conv?.participants?.length || 2;
    
    return messages.map(m => {
      const sender = m.senderId as any;
      const senderId = sender?._id?.toString() || sender?.toString() || m.senderId;
      const readBy = (m.readBy || []).map((r: any) => r.toString());
      
      // Status aniqlash: agar barcha ishtirokchilar o'qigan bo'lsa - seen
      let status: MessageStatus = 'sent';
      if (readBy.length >= participantCount) {
        status = 'seen';
      } else if (readBy.length > 1) {
        status = 'delivered';
      }
      
      return {
        id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        senderId: senderId,
        content: m.content,
        type: m.type,
        replyToId: m.replyTo?.toString(),
        createdAt: m.createdAt,
        status,
        readBy,
        sender: sender?._id ? { 
          id: sender._id.toString(), 
          username: sender.username, 
          displayName: sender.displayName, 
          profilePicture: sender.profilePicture 
        } : undefined
      };
    });
  }

  async getUserConversations(userId: string): Promise<ConversationData[]> {
    if (USE_MOCK) {
      const convs: ConversationData[] = [];
      for (const conv of mockDb.conversations.values()) {
        if (conv.participants?.includes(userId)) {
          convs.push(conv);
        }
      }
      return convs;
    }

    const conversations = await Conversation.find({ participants: userId })
      .populate('lastMessage')
      .populate('participants')
      .sort({ updatedAt: -1 });

    return Promise.all(conversations.map(async (c) => {
      const conv = this.formatConversation(c);
      if (c.type === 'direct') {
        const other = await User.findOne({ _id: { $in: c.participants, $ne: userId } });
        if (other) conv.name = other.displayName;
      }
      return conv;
    }));
  }

  async getConversationParticipants(conversationId: string): Promise<string[]> {
    if (USE_MOCK) {
      const conv = mockDb.conversations.get(conversationId);
      return conv?.participants || [];
    }
    const conv = await Conversation.findById(conversationId);
    return conv?.participants.map(p => p.toString()) || [];
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<string[]> {
    if (USE_MOCK) {
      const readMessageIds: string[] = [];
      for (const [id, msg] of mockDb.messages.entries()) {
        if (msg.conversationId === conversationId && !msg.readBy?.includes(userId)) {
          msg.readBy = [...(msg.readBy || []), userId];
          readMessageIds.push(id);
        }
      }
      return readMessageIds;
    }
    
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);
    
    // O'qilmagan xabarlarni topish - faqat boshqa foydalanuvchi yuborgan xabarlar
    const unreadMessages = await Message.find({ 
      conversationId: convObjectId, 
      senderId: { $ne: userObjectId },
      readBy: { $nin: [userObjectId] } 
    });
    
    const messageIds = unreadMessages.map(m => m._id.toString());
    
    if (messageIds.length > 0) {
      // Xabarlarni o'qilgan deb belgilash
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { $addToSet: { readBy: userObjectId } }
      );
    }
    
    return messageIds;
  }

  private formatMessage(msg: any, sender: any, participantCount: number = 2): MessageData {
    // senderId ni to'g'ri olish - populate qilingan bo'lsa object, aks holda string
    const rawSenderId = msg.senderId;
    const senderId = typeof rawSenderId === 'object' && rawSenderId?._id 
      ? rawSenderId._id.toString() 
      : (rawSenderId?.toString() || rawSenderId);
    
    const readBy = (msg.readBy || []).map((r: any) => r.toString());
    
    // Status aniqlash
    let status: MessageStatus = 'sent';
    if (readBy.length >= participantCount) {
      status = 'seen';
    } else if (readBy.length > 1) {
      status = 'delivered';
    }
    
    return {
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: senderId,
      content: msg.content,
      type: msg.type,
      replyToId: msg.replyTo?.toString(),
      createdAt: msg.createdAt,
      status,
      readBy,
      sender: sender ? { id: sender._id?.toString() || sender.id, username: sender.username, displayName: sender.displayName, profilePicture: sender.profilePicture } : undefined
    };
  }

  private formatConversation(conv: any): ConversationData {
    return {
      id: conv._id.toString(),
      type: conv.type,
      name: conv.name,
      participants: conv.participants?.map((p: any) => p._id?.toString() || p.toString()),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    };
  }
}

export const messageService = new MessageService();
