"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactService = exports.ContactService = void 0;
const models_1 = require("../models");
const database_1 = require("../config/database");
const mongoose_1 = __importDefault(require("mongoose"));
const USE_MOCK = process.env.USE_MOCK === 'true';
class ContactService {
    async addContact(userId, contactId, nickname) {
        if (USE_MOCK) {
            const id = new mongoose_1.default.Types.ObjectId().toString();
            const contact = { id, userId, contactId, nickname, createdAt: new Date() };
            database_1.mockDb.contacts.set(id, contact);
            return { success: true, contact };
        }
        const existing = await models_1.Contact.findOne({ userId, contactId });
        if (existing)
            return { success: false, message: 'Kontakt allaqachon mavjud' };
        const contact = await models_1.Contact.create({ userId, contactId, nickname });
        return { success: true, contact };
    }
    async getContacts(userId) {
        if (USE_MOCK) {
            const contacts = [];
            for (const c of database_1.mockDb.contacts.values()) {
                if (c.userId === userId) {
                    const user = database_1.mockDb.users.get(c.contactId);
                    if (user)
                        contacts.push({ ...c, contact: user });
                }
            }
            return { success: true, contacts };
        }
        const contacts = await models_1.Contact.find({ userId }).populate('contactId');
        return { success: true, contacts: contacts.map(c => ({
                id: c._id.toString(),
                userId: c.userId.toString(),
                contactId: c.contactId._id.toString(),
                nickname: c.nickname,
                contact: c.contactId
            })) };
    }
    async removeContact(userId, contactId) {
        if (USE_MOCK) {
            for (const [id, c] of database_1.mockDb.contacts.entries()) {
                if (c.userId === userId && c.contactId === contactId) {
                    database_1.mockDb.contacts.delete(id);
                    return { success: true };
                }
            }
            return { success: false, message: 'Kontakt topilmadi' };
        }
        await models_1.Contact.deleteOne({ userId, contactId });
        return { success: true };
    }
    async searchUsers(query, currentUserId) {
        if (USE_MOCK) {
            const users = [];
            for (const u of database_1.mockDb.users.values()) {
                if (u.id !== currentUserId && (u.displayName?.toLowerCase().includes(query.toLowerCase()) || u.phone?.includes(query))) {
                    users.push(u);
                }
            }
            return { success: true, users };
        }
        const users = await models_1.User.find({
            _id: { $ne: currentUserId },
            $or: [
                { displayName: { $regex: query, $options: 'i' } },
                { phone: { $regex: query } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).limit(20);
        return { success: true, users: users.map(u => ({
                id: u._id.toString(),
                phone: u.phone,
                username: u.username,
                displayName: u.displayName,
                profilePicture: u.profilePicture,
                isOnline: u.isOnline,
                lastSeen: u.lastSeen
            })) };
    }
}
exports.ContactService = ContactService;
exports.contactService = new ContactService();
