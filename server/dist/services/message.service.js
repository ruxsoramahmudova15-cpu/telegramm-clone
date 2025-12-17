"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.MessageService = void 0;
const models_1 = require("../models");
const database_1 = require("../config/database");
const mongoose_1 = __importStar(require("mongoose"));
const USE_MOCK = process.env.USE_MOCK === 'true';
class MessageService {
    async createConversation(type, participantIds, createdBy, name) {
        if (USE_MOCK) {
            const id = new mongoose_1.default.Types.ObjectId().toString();
            const conv = { id, type, name, participants: participantIds, admins: [createdBy], createdAt: new Date(), updatedAt: new Date() };
            database_1.mockDb.conversations.set(id, conv);
            return conv;
        }
        // Check existing direct conversation
        if (type === 'direct' && participantIds.length === 2) {
            const existing = await models_1.Conversation.findOne({
                type: 'direct',
                participants: { $all: participantIds, $size: 2 }
            });
            if (existing)
                return this.formatConversation(existing);
        }
        const conversation = await models_1.Conversation.create({
            type,
            name,
            participants: participantIds.map(id => new mongoose_1.Types.ObjectId(id)),
            admins: [new mongoose_1.Types.ObjectId(createdBy)]
        });
        return this.formatConversation(conversation);
    }
    async sendMessage(conversationId, senderId, content, type = 'text', replyToId) {
        if (USE_MOCK) {
            const id = new mongoose_1.default.Types.ObjectId().toString();
            const sender = database_1.mockDb.users.get(senderId);
            const msg = { id, conversationId, senderId, content, type, replyToId, createdAt: new Date(), readBy: [senderId], status: 'sent' };
            database_1.mockDb.messages.set(id, msg);
            return { ...msg, sender: sender ? { id: sender.id, username: sender.username, displayName: sender.displayName } : undefined };
        }
        const message = await models_1.Message.create({
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            senderId: new mongoose_1.Types.ObjectId(senderId),
            content,
            type,
            replyTo: replyToId ? new mongoose_1.Types.ObjectId(replyToId) : undefined,
            readBy: [new mongoose_1.Types.ObjectId(senderId)]
        });
        await models_1.Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: new Date() });
        const conv = await models_1.Conversation.findById(conversationId);
        const participantCount = conv?.participants?.length || 2;
        const sender = await models_1.User.findById(senderId);
        return this.formatMessage(message, sender, participantCount);
    }
    async getConversationMessages(conversationId, _userId, limit = 50) {
        if (USE_MOCK) {
            const messages = [];
            for (const msg of database_1.mockDb.messages.values()) {
                if (msg.conversationId === conversationId) {
                    const sender = database_1.mockDb.users.get(msg.senderId);
                    messages.push({ ...msg, sender: sender ? { id: sender.id, username: sender.username, displayName: sender.displayName } : undefined });
                }
            }
            return messages.slice(-limit);
        }
        const messages = await models_1.Message.find({ conversationId }).sort({ createdAt: 1 }).limit(limit).populate('senderId');
        const conv = await models_1.Conversation.findById(conversationId);
        const participantCount = conv?.participants?.length || 2;
        return messages.map(m => {
            const sender = m.senderId;
            const senderId = sender?._id?.toString() || sender?.toString() || m.senderId;
            const readBy = (m.readBy || []).map((r) => r.toString());
            // Status aniqlash: agar barcha ishtirokchilar o'qigan bo'lsa - seen
            let status = 'sent';
            if (readBy.length >= participantCount) {
                status = 'seen';
            }
            else if (readBy.length > 1) {
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
    async getUserConversations(userId) {
        if (USE_MOCK) {
            const convs = [];
            for (const conv of database_1.mockDb.conversations.values()) {
                if (conv.participants?.includes(userId)) {
                    convs.push(conv);
                }
            }
            return convs;
        }
        const conversations = await models_1.Conversation.find({ participants: userId })
            .populate('lastMessage')
            .populate('participants')
            .sort({ updatedAt: -1 });
        return Promise.all(conversations.map(async (c) => {
            const conv = this.formatConversation(c);
            if (c.type === 'direct') {
                const other = await models_1.User.findOne({ _id: { $in: c.participants, $ne: userId } });
                if (other)
                    conv.name = other.displayName;
            }
            return conv;
        }));
    }
    async getConversationParticipants(conversationId) {
        if (USE_MOCK) {
            const conv = database_1.mockDb.conversations.get(conversationId);
            return conv?.participants || [];
        }
        const conv = await models_1.Conversation.findById(conversationId);
        return conv?.participants.map(p => p.toString()) || [];
    }
    async markMessagesAsRead(conversationId, userId) {
        if (USE_MOCK) {
            const readMessageIds = [];
            for (const [id, msg] of database_1.mockDb.messages.entries()) {
                if (msg.conversationId === conversationId && !msg.readBy?.includes(userId)) {
                    msg.readBy = [...(msg.readBy || []), userId];
                    readMessageIds.push(id);
                }
            }
            return readMessageIds;
        }
        const convObjectId = new mongoose_1.Types.ObjectId(conversationId);
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        // O'qilmagan xabarlarni topish - faqat boshqa foydalanuvchi yuborgan xabarlar
        const unreadMessages = await models_1.Message.find({
            conversationId: convObjectId,
            senderId: { $ne: userObjectId },
            readBy: { $nin: [userObjectId] }
        });
        const messageIds = unreadMessages.map(m => m._id.toString());
        if (messageIds.length > 0) {
            // Xabarlarni o'qilgan deb belgilash
            await models_1.Message.updateMany({ _id: { $in: unreadMessages.map(m => m._id) } }, { $addToSet: { readBy: userObjectId } });
        }
        return messageIds;
    }
    formatMessage(msg, sender, participantCount = 2) {
        // senderId ni to'g'ri olish - populate qilingan bo'lsa object, aks holda string
        const rawSenderId = msg.senderId;
        const senderId = typeof rawSenderId === 'object' && rawSenderId?._id
            ? rawSenderId._id.toString()
            : (rawSenderId?.toString() || rawSenderId);
        const readBy = (msg.readBy || []).map((r) => r.toString());
        // Status aniqlash
        let status = 'sent';
        if (readBy.length >= participantCount) {
            status = 'seen';
        }
        else if (readBy.length > 1) {
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
    formatConversation(conv) {
        return {
            id: conv._id.toString(),
            type: conv.type,
            name: conv.name,
            participants: conv.participants?.map((p) => p._id?.toString() || p.toString()),
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt
        };
    }
}
exports.MessageService = MessageService;
exports.messageService = new MessageService();
