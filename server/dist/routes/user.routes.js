"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const models_1 = require("../models");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
const isMockMode = () => process.env.USE_MOCK === 'true';
// GET /api/users/search - Search users
router.get('/search', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.length < 2) {
            res.status(400).json({ success: false, message: 'Qidiruv so\'zi kamida 2 ta belgidan iborat bo\'lishi kerak' });
            return;
        }
        let users = [];
        if (isMockMode()) {
            for (const u of database_1.mockDb.users.values()) {
                if (u.id !== req.user.userId && (u.displayName?.toLowerCase().includes(q.toLowerCase()) || u.username?.toLowerCase().includes(q.toLowerCase()))) {
                    users.push({ id: u.id, username: u.username, displayName: u.displayName, profilePicture: u.profilePicture, isOnline: u.isOnline, lastSeen: u.lastSeen });
                }
            }
        }
        else {
            const result = await models_1.User.find({
                _id: { $ne: req.user.userId },
                $or: [{ username: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }]
            }).limit(20);
            users = result.map(u => ({ id: u._id.toString(), username: u.username, displayName: u.displayName, profilePicture: u.profilePicture, isOnline: u.isOnline, lastSeen: u.lastSeen }));
        }
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        let user = null;
        if (isMockMode()) {
            user = database_1.mockDb.users.get(id);
        }
        else {
            const result = await models_1.User.findById(id);
            if (result) {
                user = { id: result._id.toString(), username: result.username, displayName: result.displayName, profilePicture: result.profilePicture, isOnline: result.isOnline, lastSeen: result.lastSeen, createdAt: result.createdAt };
            }
        }
        if (!user) {
            res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
            return;
        }
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// GET /api/users/:id/status - Get user online status
router.get('/:id/status', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        let status = { isOnline: false, lastSeen: null };
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(id);
            if (user) {
                status = { isOnline: user.isOnline || false, lastSeen: user.lastSeen || null };
            }
        }
        else {
            const user = await models_1.User.findById(id).select('isOnline lastSeen');
            if (user) {
                status = { isOnline: user.isOnline || false, lastSeen: user.lastSeen || null };
            }
        }
        res.json({ success: true, ...status });
    }
    catch (error) {
        console.error('Get user status error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// GET /api/users/statuses/bulk - Get multiple users status
router.post('/statuses/bulk', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ success: false, message: 'userIds massivi kerak' });
            return;
        }
        const statuses = {};
        if (isMockMode()) {
            for (const id of userIds) {
                const user = database_1.mockDb.users.get(id);
                if (user) {
                    statuses[id] = {
                        isOnline: user.isOnline || false,
                        lastSeen: user.lastSeen?.toISOString() || null
                    };
                }
            }
        }
        else {
            const users = await models_1.User.find({ _id: { $in: userIds } }).select('isOnline lastSeen');
            for (const user of users) {
                statuses[user._id.toString()] = {
                    isOnline: user.isOnline || false,
                    lastSeen: user.lastSeen?.toISOString() || null
                };
            }
        }
        res.json({ success: true, statuses });
    }
    catch (error) {
        console.error('Get bulk statuses error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/users/profile - Update profile
router.put('/profile', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { displayName, username, profilePicture, bio } = req.body;
        let user = null;
        // Username tekshirish (agar o'zgartirilsa)
        if (username) {
            const existingUser = isMockMode()
                ? Array.from(database_1.mockDb.users.values()).find(u => u.username === username && u.id !== req.user.userId)
                : await models_1.User.findOne({ username, _id: { $ne: req.user.userId } });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'Bu username allaqachon band' });
                return;
            }
        }
        if (isMockMode()) {
            user = database_1.mockDb.users.get(req.user.userId);
            if (user) {
                if (displayName)
                    user.displayName = displayName;
                if (username)
                    user.username = username;
                if (profilePicture)
                    user.profilePicture = profilePicture;
                if (bio !== undefined)
                    user.bio = bio;
                user.updatedAt = new Date();
            }
        }
        else {
            const updateData = { updatedAt: new Date() };
            if (displayName)
                updateData.displayName = displayName;
            if (username)
                updateData.username = username;
            if (profilePicture)
                updateData.profilePicture = profilePicture;
            if (bio !== undefined)
                updateData.bio = bio;
            const result = await models_1.User.findByIdAndUpdate(req.user.userId, updateData, { new: true });
            if (result) {
                user = { id: result._id.toString(), phone: result.phone, username: result.username, displayName: result.displayName, profilePicture: result.profilePicture, bio: result.bio, isOnline: result.isOnline, lastSeen: result.lastSeen, createdAt: result.createdAt, updatedAt: result.updatedAt };
            }
        }
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
