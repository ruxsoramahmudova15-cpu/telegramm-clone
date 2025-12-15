import { Contact, User } from '../models';
import { mockDb } from '../config/database';
import mongoose from 'mongoose';

const USE_MOCK = process.env.USE_MOCK === 'true';

export class ContactService {
  async addContact(userId: string, contactId: string, nickname?: string) {
    if (USE_MOCK) {
      const id = new mongoose.Types.ObjectId().toString();
      const contact = { id, userId, contactId, nickname, createdAt: new Date() };
      mockDb.contacts.set(id, contact);
      return { success: true, contact };
    }

    const existing = await Contact.findOne({ userId, contactId });
    if (existing) return { success: false, message: 'Kontakt allaqachon mavjud' };

    const contact = await Contact.create({ userId, contactId, nickname });
    return { success: true, contact };
  }

  async getContacts(userId: string) {
    if (USE_MOCK) {
      const contacts: any[] = [];
      for (const c of mockDb.contacts.values()) {
        if (c.userId === userId) {
          const user = mockDb.users.get(c.contactId);
          if (user) contacts.push({ ...c, contact: user });
        }
      }
      return { success: true, contacts };
    }

    const contacts = await Contact.find({ userId }).populate('contactId');
    return { success: true, contacts: contacts.map(c => ({
      id: c._id.toString(),
      userId: c.userId.toString(),
      contactId: (c.contactId as any)._id.toString(),
      nickname: c.nickname,
      contact: c.contactId
    }))};
  }

  async removeContact(userId: string, contactId: string) {
    if (USE_MOCK) {
      for (const [id, c] of mockDb.contacts.entries()) {
        if (c.userId === userId && c.contactId === contactId) {
          mockDb.contacts.delete(id);
          return { success: true };
        }
      }
      return { success: false, message: 'Kontakt topilmadi' };
    }

    await Contact.deleteOne({ userId, contactId });
    return { success: true };
  }

  async searchUsers(query: string, currentUserId: string) {
    if (USE_MOCK) {
      const users: any[] = [];
      for (const u of mockDb.users.values()) {
        if (u.id !== currentUserId && (u.displayName?.toLowerCase().includes(query.toLowerCase()) || u.phone?.includes(query))) {
          users.push(u);
        }
      }
      return { success: true, users };
    }

    const users = await User.find({
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
    }))};
  }
}

export const contactService = new ContactService();
