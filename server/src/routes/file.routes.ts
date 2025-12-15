import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { fileService } from '../services/file.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// POST /api/files/upload - Upload file
router.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const file = req.file;
    
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Fayl tanlanmagan'
      });
      return;
    }

    const { messageId } = req.body;
    const uploadedFile = await fileService.uploadFile(file, authReq.user!.userId, messageId);

    res.status(201).json({
      success: true,
      file: uploadedFile
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Fayl yuklashda xatolik'
    });
  }
});

// GET /api/files/:id - Get file info
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const file = await fileService.getFileById(id);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'Fayl topilmadi'
      });
      return;
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});


// GET /api/files/:id/download - Download file (public - no auth required for media)
router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('📥 Download request for file:', id);
    
    const file = await fileService.getFileById(id);

    if (!file) {
      console.log('❌ File not found in database:', id);
      res.status(404).json({
        success: false,
        message: 'Fayl topilmadi'
      });
      return;
    }

    console.log('📁 File found:', file.filename, file.mimeType);
    const filePath = fileService.getFilePath(file.filename);

    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found on disk:', filePath);
      res.status(404).json({
        success: false,
        message: 'Fayl topilmadi'
      });
      return;
    }

    // CORS headers for media files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Rasmlar va videolar uchun inline
    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');
    
    if (isImage || isVideo) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    }
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 yil cache
    res.setHeader('Accept-Ranges', 'bytes'); // Video streaming uchun
    
    console.log('✅ Sending file:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    await fileService.deleteFile(id, authReq.user!.userId);

    res.json({
      success: true,
      message: 'Fayl o\'chirildi'
    });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server xatosi'
    });
  }
});

export default router;