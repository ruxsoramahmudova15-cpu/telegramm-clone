"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const models_1 = require("../models");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
const isMockMode = () => process.env.USE_MOCK === 'true';
// Default settings
const defaultSettings = {
    lastSeenVisibility: 'everyone',
    profilePhotoVisibility: 'everyone',
    onlineStatusVisibility: 'everyone',
    readReceipts: true,
    messageNotifications: true,
    groupNotifications: true,
    notificationSound: true,
    notificationPreview: true,
    theme: 'dark',
    chatBackground: '',
    accentColor: '#5ca0d3',
};
// GET /api/settings - Get user settings
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        let settings = defaultSettings;
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(req.user.userId);
            if (user?.settings) {
                settings = { ...defaultSettings, ...user.settings };
            }
        }
        else {
            const user = await models_1.User.findById(req.user.userId).select('settings');
            if (user?.settings) {
                settings = { ...defaultSettings, ...user.settings };
            }
        }
        res.json({ success: true, settings });
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/settings - Update user settings
router.put('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        // Validate settings
        const allowedFields = [
            'lastSeenVisibility', 'profilePhotoVisibility', 'onlineStatusVisibility', 'readReceipts',
            'messageNotifications', 'groupNotifications', 'notificationSound', 'notificationPreview',
            'theme', 'chatBackground', 'accentColor'
        ];
        const validUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                validUpdates[key] = updates[key];
            }
        }
        let settings = defaultSettings;
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(req.user.userId);
            if (user) {
                user.settings = { ...(user.settings || defaultSettings), ...validUpdates };
                settings = user.settings;
            }
        }
        else {
            const user = await models_1.User.findByIdAndUpdate(req.user.userId, { $set: { settings: { ...defaultSettings, ...validUpdates } } }, { new: true }).select('settings');
            if (user?.settings) {
                settings = user.settings;
            }
        }
        res.json({ success: true, settings });
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/settings/privacy - Update privacy settings only
router.put('/privacy', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { lastSeenVisibility, profilePhotoVisibility, onlineStatusVisibility, readReceipts } = req.body;
        const privacyUpdates = {};
        if (lastSeenVisibility)
            privacyUpdates['settings.lastSeenVisibility'] = lastSeenVisibility;
        if (profilePhotoVisibility)
            privacyUpdates['settings.profilePhotoVisibility'] = profilePhotoVisibility;
        if (onlineStatusVisibility)
            privacyUpdates['settings.onlineStatusVisibility'] = onlineStatusVisibility;
        if (readReceipts !== undefined)
            privacyUpdates['settings.readReceipts'] = readReceipts;
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(req.user.userId);
            if (user) {
                user.settings = { ...(user.settings || defaultSettings), ...req.body };
            }
        }
        else {
            await models_1.User.findByIdAndUpdate(req.user.userId, { $set: privacyUpdates });
        }
        res.json({ success: true, message: 'Maxfiylik sozlamalari yangilandi' });
    }
    catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/settings/notifications - Update notification settings only
router.put('/notifications', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { messageNotifications, groupNotifications, notificationSound, notificationPreview } = req.body;
        const notifUpdates = {};
        if (messageNotifications !== undefined)
            notifUpdates['settings.messageNotifications'] = messageNotifications;
        if (groupNotifications !== undefined)
            notifUpdates['settings.groupNotifications'] = groupNotifications;
        if (notificationSound !== undefined)
            notifUpdates['settings.notificationSound'] = notificationSound;
        if (notificationPreview !== undefined)
            notifUpdates['settings.notificationPreview'] = notificationPreview;
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(req.user.userId);
            if (user) {
                user.settings = { ...(user.settings || defaultSettings), ...req.body };
            }
        }
        else {
            await models_1.User.findByIdAndUpdate(req.user.userId, { $set: notifUpdates });
        }
        res.json({ success: true, message: 'Bildirishnoma sozlamalari yangilandi' });
    }
    catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// PUT /api/settings/theme - Update theme settings only
router.put('/theme', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { theme, chatBackground, accentColor } = req.body;
        const themeUpdates = {};
        if (theme)
            themeUpdates['settings.theme'] = theme;
        if (chatBackground !== undefined)
            themeUpdates['settings.chatBackground'] = chatBackground;
        if (accentColor)
            themeUpdates['settings.accentColor'] = accentColor;
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(req.user.userId);
            if (user) {
                user.settings = { ...(user.settings || defaultSettings), ...req.body };
            }
        }
        else {
            await models_1.User.findByIdAndUpdate(req.user.userId, { $set: themeUpdates });
        }
        res.json({ success: true, message: 'Tema sozlamalari yangilandi' });
    }
    catch (error) {
        console.error('Update theme settings error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
