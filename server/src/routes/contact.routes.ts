import { Router, Request, Response } from 'express';
import { contactService } from '../services/contact.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/contacts - Get user's contacts
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const result = await contactService.getContacts(authReq.user!.userId);
    res.json(result);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// POST /api/contacts - Add contact
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { contactId, nickname } = req.body;
    if (!contactId) {
      res.status(400).json({ success: false, message: 'Kontakt ID talab qilinadi' });
      return;
    }
    const result = await contactService.addContact(authReq.user!.userId, contactId, nickname);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Add contact error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server xatosi' });
  }
});

// DELETE /api/contacts/:id - Remove contact
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const result = await contactService.removeContact(authReq.user!.userId, id);
    res.json(result);
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/contacts/search - Search users
router.get('/search', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, message: 'Qidiruv so\'zi talab qilinadi' });
      return;
    }
    const result = await contactService.searchUsers(q, authReq.user!.userId);
    res.json(result);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
