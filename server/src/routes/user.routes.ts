import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models';
import { mockDb } from '../config/database';

const router = Router();
const isMockMode = () => process.env.USE_MOCK === 'true';

// GET /api/users/search - Search users
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      res.status(400).json({ success: false, message: 'Qidiruv so\'zi kamida 2 ta belgidan iborat bo\'lishi kerak' });
      return;
    }

    let users: any[] = [];

    if (isMockMode()) {
      for (const u of mockDb.users.values()) {
        if (u.id !== req.user!.userId && (u.displayName?.toLowerCase().includes(q.toLowerCase()) || u.username?.toLowerCase().includes(q.toLowerCase()))) {
          users.push({ id: u.id, username: u.username, displayName: u.displayName, profilePicture: u.profilePicture, isOnline: u.isOnline, lastSeen: u.lastSeen });
        }
      }
    } else {
      const result = await User.find({
        _id: { $ne: req.user!.userId },
        $or: [{ username: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }]
      }).limit(20);
      users = result.map(u => ({ id: u._id.toString(), username: u.username, displayName: u.displayName, profilePicture: u.profilePicture, isOnline: u.isOnline, lastSeen: u.lastSeen }));
    }

    res.json({ success: true, users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let user: any = null;

    if (isMockMode()) {
      user = mockDb.users.get(id);
    } else {
      const result = await User.findById(id);
      if (result) {
        user = { id: result._id.toString(), username: result.username, displayName: result.displayName, profilePicture: result.profilePicture, isOnline: result.isOnline, lastSeen: result.lastSeen, createdAt: result.createdAt };
      }
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/users/:id/status - Get user online status
router.get('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let status: { isOnline: boolean; lastSeen: Date | null } = { isOnline: false, lastSeen: null };

    if (isMockMode()) {
      const user = mockDb.users.get(id);
      if (user) {
        status = { isOnline: user.isOnline || false, lastSeen: user.lastSeen || null };
      }
    } else {
      const user = await User.findById(id).select('isOnline lastSeen');
      if (user) {
        status = { isOnline: user.isOnline || false, lastSeen: user.lastSeen || null };
      }
    }

    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/users/statuses/bulk - Get multiple users status
router.post('/statuses/bulk', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ success: false, message: 'userIds massivi kerak' });
      return;
    }

    const statuses: Record<string, { isOnline: boolean; lastSeen: string | null }> = {};

    if (isMockMode()) {
      for (const id of userIds) {
        const user = mockDb.users.get(id);
        if (user) {
          statuses[id] = { 
            isOnline: user.isOnline || false, 
            lastSeen: user.lastSeen?.toISOString() || null 
          };
        }
      }
    } else {
      const users = await User.find({ _id: { $in: userIds } }).select('isOnline lastSeen');
      for (const user of users) {
        statuses[user._id.toString()] = { 
          isOnline: user.isOnline || false, 
          lastSeen: user.lastSeen?.toISOString() || null 
        };
      }
    }

    res.json({ success: true, statuses });
  } catch (error) {
    console.error('Get bulk statuses error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// PUT /api/users/profile - Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, username, profilePicture, bio } = req.body;
    let user: any = null;

    // Username tekshirish (agar o'zgartirilsa)
    if (username) {
      const existingUser = isMockMode() 
        ? Array.from(mockDb.users.values()).find(u => u.username === username && u.id !== req.user!.userId)
        : await User.findOne({ username, _id: { $ne: req.user!.userId } });
      
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Bu username allaqachon band' });
        return;
      }
    }

    if (isMockMode()) {
      user = mockDb.users.get(req.user!.userId);
      if (user) {
        if (displayName) user.displayName = displayName;
        if (username) user.username = username;
        if (profilePicture) user.profilePicture = profilePicture;
        if (bio !== undefined) user.bio = bio;
        user.updatedAt = new Date();
      }
    } else {
      const updateData: any = { updatedAt: new Date() };
      if (displayName) updateData.displayName = displayName;
      if (username) updateData.username = username;
      if (profilePicture) updateData.profilePicture = profilePicture;
      if (bio !== undefined) updateData.bio = bio;

      const result = await User.findByIdAndUpdate(req.user!.userId, updateData, { new: true });
      if (result) {
        user = { id: result._id.toString(), phone: result.phone, username: result.username, displayName: result.displayName, profilePicture: result.profilePicture, bio: result.bio, isOnline: result.isOnline, lastSeen: result.lastSeen, createdAt: result.createdAt, updatedAt: result.updatedAt };
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
