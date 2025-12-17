"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_service_1 = require("../services/group.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/groups - Create new group
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { name, participantIds, description, picture } = req.body;
        if (!name || !participantIds || !Array.isArray(participantIds)) {
            res.status(400).json({ success: false, message: 'Guruh nomi va a\'zolar ro\'yxati talab qilinadi' });
            return;
        }
        const result = await group_service_1.groupService.createGroup(name, req.user.userId, participantIds, description, picture);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// GET /api/groups/:id - Get group details
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await group_service_1.groupService.getGroup(id, req.user.userId);
        if (!result.success) {
            res.status(404).json(result);
            return;
        }
        res.json(result);
    }
    catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// POST /api/groups/:id/members - Add member to group
router.post('/:id/members', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, message: 'Foydalanuvchi ID talab qilinadi' });
            return;
        }
        const result = await group_service_1.groupService.addMember(id, userId, req.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Add member error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
// DELETE /api/groups/:id/members/:userId - Remove member from group
router.delete('/:id/members/:userId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id, userId } = req.params;
        const result = await group_service_1.groupService.removeMember(id, userId, req.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
// PUT /api/groups/:id - Update group info
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, picture } = req.body;
        const result = await group_service_1.groupService.updateGroup(id, req.user.userId, { name, description, picture });
        res.json(result);
    }
    catch (error) {
        console.error('Update group error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
// POST /api/groups/:id/leave - Leave group
router.post('/:id/leave', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await group_service_1.groupService.leaveGroup(id, req.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Leave group error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
// POST /api/groups/:id/admins - Make user admin
router.post('/:id/admins', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, message: 'Foydalanuvchi ID talab qilinadi' });
            return;
        }
        const result = await group_service_1.groupService.makeAdmin(id, userId, req.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Make admin error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
// DELETE /api/groups/:id/admins/:userId - Remove admin
router.delete('/:id/admins/:userId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id, userId } = req.params;
        const result = await group_service_1.groupService.removeAdmin(id, userId, req.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Remove admin error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
exports.default = router;
