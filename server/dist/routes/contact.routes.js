"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_service_1 = require("../services/contact.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/contacts - Get user's contacts
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const authReq = req;
    try {
        const result = await contact_service_1.contactService.getContacts(authReq.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// POST /api/contacts - Add contact
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const authReq = req;
    try {
        const { contactId, nickname } = req.body;
        if (!contactId) {
            res.status(400).json({ success: false, message: 'Kontakt ID talab qilinadi' });
            return;
        }
        const result = await contact_service_1.contactService.addContact(authReq.user.userId, contactId, nickname);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Add contact error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
// DELETE /api/contacts/:id - Remove contact
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    const authReq = req;
    try {
        const { id } = req.params;
        const result = await contact_service_1.contactService.removeContact(authReq.user.userId, id);
        res.json(result);
    }
    catch (error) {
        console.error('Remove contact error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// GET /api/contacts/search - Search users
router.get('/search', auth_middleware_1.authMiddleware, async (req, res) => {
    const authReq = req;
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            res.status(400).json({ success: false, message: 'Qidiruv so\'zi talab qilinadi' });
            return;
        }
        const result = await contact_service_1.contactService.searchUsers(q, authReq.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
