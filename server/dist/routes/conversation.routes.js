"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_service_1 = require("../services/message.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/conversations - Get user's conversations
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const conversations = await message_service_1.messageService.getUserConversations(req.user.userId);
        res.json({
            success: true,
            conversations
        });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
// GET /api/conversations/:id/messages - Get conversation messages
router.get('/:id/messages', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit, before } = req.query;
        const messages = await message_service_1.messageService.getConversationMessages(id, req.user.userId, limit ? parseInt(limit) : 50);
        res.json({
            success: true,
            messages
        });
    }
    catch (error) {
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
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
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
        if (!participantIds.includes(req.user.userId)) {
            participantIds.push(req.user.userId);
        }
        const conversation = await message_service_1.messageService.createConversation(type, participantIds, req.user.userId, name);
        res.status(201).json({
            success: true,
            conversation
        });
    }
    catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
// POST /api/conversations/:id/read - Mark messages as read
router.post('/:id/read', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await message_service_1.messageService.markMessagesAsRead(id, req.user.userId);
        res.json({
            success: true,
            message: 'Xabarlar o\'qildi deb belgilandi'
        });
    }
    catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
exports.default = router;
