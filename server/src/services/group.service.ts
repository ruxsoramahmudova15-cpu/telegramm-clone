import { Conversation, User } from '../models';
import { mockDb } from '../config/database';
import mongoose from 'mongoose';

const USE_MOCK = process.env.USE_MOCK === 'true';

export class GroupService {
  async createGroup(name: string, creatorId: string, memberIds: string[], description?: string, picture?: string) {
    const participants = [creatorId, ...memberIds.filter(id => id !== creatorId)];
    
    if (USE_MOCK) {
      const id = new mongoose.Types.ObjectId().toString();
      const group = { 
        id, type: 'group', name, description, picture, 
        participants, admins: [creatorId], createdBy: creatorId,
        createdAt: new Date(), updatedAt: new Date() 
      };
      mockDb.conversations.set(id, group);
      return { success: true, group };
    }

    const group = await Conversation.create({
      type: 'group',
      name,
      description,
      picture,
      participants,
      admins: [creatorId],
      createdBy: creatorId
    });

    return { success: true, group: {
      id: group._id.toString(),
      type: group.type,
      name: group.name,
      description: group.description,
      picture: group.picture,
      participants: group.participants.map(p => p.toString()),
      admins: group.admins.map(a => a.toString()),
      createdBy: group.createdBy?.toString(),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }};
  }

  async getGroup(groupId: string, userId: string) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
      if (!group.participants.includes(userId)) return { success: false, message: 'Ruxsat yo\'q' };
      
      // Get member details
      const members = group.participants.map((pId: string) => {
        const user = mockDb.users.get(pId);
        return user ? {
          id: pId,
          displayName: user.displayName,
          username: user.username,
          profilePicture: user.profilePicture,
          isOnline: user.isOnline
        } : null;
      }).filter(Boolean);
      
      return { success: true, group: { ...group, members } };
    }

    const group = await Conversation.findById(groupId)
      .populate('participants', 'displayName username profilePicture isOnline lastSeen')
      .populate('admins', 'displayName username')
      .populate('createdBy', 'displayName username');
    
    if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
    if (!group.participants.some(p => p._id.toString() === userId)) {
      return { success: false, message: 'Ruxsat yo\'q' };
    }

    return { 
      success: true, 
      group: {
        id: group._id.toString(),
        type: group.type,
        name: group.name,
        description: group.description,
        picture: group.picture,
        participants: group.participants.map((p: any) => p._id.toString()),
        members: group.participants.map((p: any) => ({
          id: p._id.toString(),
          displayName: p.displayName,
          username: p.username,
          profilePicture: p.profilePicture,
          isOnline: p.isOnline,
          lastSeen: p.lastSeen
        })),
        admins: group.admins.map((a: any) => a._id.toString()),
        createdBy: group.createdBy ? {
          id: (group.createdBy as any)._id.toString(),
          displayName: (group.createdBy as any).displayName
        } : null,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    };
  }

  async addMember(groupId: string, userId: string, adminId: string) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
      if (!group.admins?.includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };
      if (!group.participants.includes(userId)) group.participants.push(userId);
      return { success: true };
    }

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
    if (!group.admins.map(a => a.toString()).includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };

    await Conversation.findByIdAndUpdate(groupId, { $addToSet: { participants: userId } });
    return { success: true };
  }

  async removeMember(groupId: string, userId: string, adminId: string) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
      if (!group.admins?.includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };
      group.participants = group.participants.filter((p: string) => p !== userId);
      return { success: true };
    }

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
    if (!group.admins.map(a => a.toString()).includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };

    await Conversation.findByIdAndUpdate(groupId, { $pull: { participants: userId, admins: userId } });
    return { success: true };
  }

  async leaveGroup(groupId: string, userId: string) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group) return { success: false, message: 'Guruh topilmadi' };
      group.participants = group.participants.filter((p: string) => p !== userId);
      group.admins = group.admins?.filter((a: string) => a !== userId);
      return { success: true };
    }

    await Conversation.findByIdAndUpdate(groupId, { $pull: { participants: userId, admins: userId } });
    return { success: true };
  }

  async updateGroup(groupId: string, adminId: string, updates: { name?: string; description?: string; picture?: string }) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
      if (!group.admins?.includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };
      if (updates.name) group.name = updates.name;
      if (updates.description !== undefined) group.description = updates.description;
      if (updates.picture !== undefined) group.picture = updates.picture;
      return { success: true, group };
    }

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
    if (!group.admins.map(a => a.toString()).includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };

    const updated = await Conversation.findByIdAndUpdate(groupId, updates, { new: true });
    return { 
      success: true, 
      group: {
        id: updated!._id.toString(),
        type: updated!.type,
        name: updated!.name,
        description: updated!.description,
        picture: updated!.picture,
        participants: updated!.participants.map(p => p.toString()),
        admins: updated!.admins.map(a => a.toString()),
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt
      }
    };
  }

  async makeAdmin(groupId: string, userId: string, adminId: string) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
      if (!group.admins?.includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };
      if (!group.admins.includes(userId)) group.admins.push(userId);
      return { success: true };
    }

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
    if (!group.admins.map(a => a.toString()).includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };

    await Conversation.findByIdAndUpdate(groupId, { $addToSet: { admins: userId } });
    return { success: true };
  }

  async removeAdmin(groupId: string, userId: string, adminId: string) {
    if (USE_MOCK) {
      const group = mockDb.conversations.get(groupId);
      if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
      if (!group.admins?.includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };
      group.admins = group.admins.filter((a: string) => a !== userId);
      return { success: true };
    }

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') return { success: false, message: 'Guruh topilmadi' };
    if (!group.admins.map(a => a.toString()).includes(adminId)) return { success: false, message: 'Ruxsat yo\'q' };

    await Conversation.findByIdAndUpdate(groupId, { $pull: { admins: userId } });
    return { success: true };
  }
}

export const groupService = new GroupService();
