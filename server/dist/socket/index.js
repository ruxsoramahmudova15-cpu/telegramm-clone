"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUsers = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const message_service_1 = require("../services/message.service");
const notification_service_1 = require("../services/notification.service");
const models_1 = require("../models");
const database_1 = require("../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const USE_MOCK = process.env.USE_MOCK === 'true';
const onlineUsers = new Map();
exports.onlineUsers = onlineUsers;
const initializeSocket = (httpServer) => {
    // CORS configuration - production va development uchun
    const corsOrigin = process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL || '*'
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: corsOrigin,
            credentials: true,
            methods: ['GET', 'POST']
        }
    });
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token)
                return next(new Error('Authentication required'));
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', async (socket) => {
        const userId = socket.userId;
        console.log(`User connected: ${userId}`);
        if (!onlineUsers.has(userId))
            onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);
        await updateUserOnlineStatus(userId, true);
        const conversations = await message_service_1.messageService.getUserConversations(userId);
        conversations.forEach(conv => socket.join(`conversation:${conv.id}`));
        broadcastUserStatus(io, userId, true);
        socket.on('message:send', async (data) => {
            try {
                const message = await message_service_1.messageService.sendMessage(data.conversationId, userId, data.content, data.type || 'text', data.replyToId);
                io.to(`conversation:${data.conversationId}`).emit('message:new', message);
                // Send notification to other participants
                const conversation = USE_MOCK
                    ? database_1.mockDb.conversations.get(data.conversationId)
                    : await models_1.Conversation.findById(data.conversationId);
                if (conversation) {
                    const participants = USE_MOCK
                        ? conversation.participants
                        : conversation.participants.map((p) => p.toString());
                    // Get sender info
                    const sender = USE_MOCK
                        ? database_1.mockDb.users.get(userId)
                        : await models_1.User.findById(userId).select('displayName');
                    const senderName = sender?.displayName || 'Foydalanuvchi';
                    // Notify other participants
                    for (const participantId of participants) {
                        if (participantId !== userId) {
                            // Create notification
                            const notifTitle = conversation.type === 'group'
                                ? `${conversation.name || 'Guruh'}`
                                : senderName;
                            let notifBody = data.content;
                            if (data.type === 'image')
                                notifBody = '📷 Rasm';
                            else if (data.type === 'video')
                                notifBody = '🎬 Video';
                            else if (data.type === 'file')
                                notifBody = '📎 Fayl';
                            else if (data.type === 'voice')
                                notifBody = '🎤 Ovozli xabar';
                            else if (notifBody.length > 50)
                                notifBody = notifBody.substring(0, 50) + '...';
                            if (conversation.type === 'group') {
                                notifBody = `${senderName}: ${notifBody}`;
                            }
                            const notification = await notification_service_1.notificationService.createNotification(participantId, 'message', notifTitle, notifBody, {
                                conversationId: data.conversationId,
                                messageId: message.id,
                                senderId: userId,
                                senderName
                            });
                            // Emit to user's sockets
                            const participantSockets = onlineUsers.get(participantId);
                            if (participantSockets) {
                                participantSockets.forEach(socketId => {
                                    io.to(socketId).emit('notification:new', notification);
                                });
                            }
                        }
                    }
                }
            }
            catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
        socket.on('typing:start', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', { conversationId: data.conversationId, userId, isTyping: true });
        });
        socket.on('typing:stop', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', { conversationId: data.conversationId, userId, isTyping: false });
        });
        socket.on('messages:read', async (data) => {
            try {
                const readMessageIds = await message_service_1.messageService.markMessagesAsRead(data.conversationId, userId);
                console.log(`📖 User ${userId} read ${readMessageIds.length} messages in conversation ${data.conversationId}`);
                if (readMessageIds.length > 0) {
                    const roomName = `conversation:${data.conversationId}`;
                    // Room'dagi barcha socketlarni ko'rish
                    const roomSockets = io.sockets.adapter.rooms.get(roomName);
                    console.log(`🏠 Room ${roomName} has ${roomSockets?.size || 0} sockets:`, roomSockets ? Array.from(roomSockets) : []);
                    // Boshqa foydalanuvchilarga xabar yuborish (o'ziga emas)
                    socket.to(roomName).emit('messages:seen', {
                        conversationId: data.conversationId,
                        userId,
                        messageIds: readMessageIds
                    });
                    console.log(`📢 Sent messages:seen event to room ${roomName} (excluding sender socket ${socket.id})`);
                }
            }
            catch (error) {
                console.error('messages:read error:', error);
                socket.emit('error', { message: error.message });
            }
        });
        socket.on('conversation:create', async (data) => {
            try {
                const conversation = await message_service_1.messageService.createConversation(data.type, data.participantIds, userId, data.name);
                data.participantIds.forEach(participantId => {
                    const participantSockets = onlineUsers.get(participantId);
                    if (participantSockets) {
                        participantSockets.forEach(socketId => {
                            io.sockets.sockets.get(socketId)?.join(`conversation:${conversation.id}`);
                            io.to(socketId).emit('conversation:new', conversation);
                        });
                    }
                });
            }
            catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
        socket.on('conversation:join', (data) => {
            const roomName = `conversation:${data.conversationId}`;
            socket.join(roomName);
            console.log(`🚪 User ${userId} joined room ${roomName}`);
        });
        socket.on('conversation:leave', (data) => {
            socket.leave(`conversation:${data.conversationId}`);
        });
        // Send online users list when requested
        socket.on('users:online:request', async () => {
            const onlineUsersList = [];
            for (const [id] of onlineUsers) {
                onlineUsersList.push({ userId: id, lastSeen: new Date().toISOString() });
            }
            socket.emit('users:online:list', onlineUsersList);
        });
        // Get specific user status
        socket.on('user:status:request', async (data) => {
            const isOnline = onlineUsers.has(data.userId);
            let lastSeen = null;
            if (USE_MOCK) {
                const user = database_1.mockDb.users.get(data.userId);
                lastSeen = user?.lastSeen || null;
            }
            else {
                const user = await models_1.User.findById(data.userId).select('lastSeen');
                lastSeen = user?.lastSeen || null;
            }
            socket.emit('user:status:response', {
                userId: data.userId,
                isOnline,
                lastSeen: lastSeen?.toISOString() || null
            });
        });
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${userId}`);
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    await updateUserOnlineStatus(userId, false);
                    broadcastUserStatus(io, userId, false);
                }
            }
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
async function updateUserOnlineStatus(userId, isOnline) {
    if (USE_MOCK) {
        const user = database_1.mockDb.users.get(userId);
        if (user) {
            user.isOnline = isOnline;
            user.lastSeen = new Date();
        }
    }
    else {
        await models_1.User.findByIdAndUpdate(userId, { isOnline, lastSeen: new Date() });
    }
}
function broadcastUserStatus(io, userId, isOnline) {
    io.emit('user:status', { userId, isOnline, lastSeen: new Date().toISOString() });
}
