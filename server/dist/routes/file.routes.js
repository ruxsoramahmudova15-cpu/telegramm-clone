"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const file_service_1 = require("../services/file.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});
// POST /api/files/upload - Upload file
router.post('/upload', auth_middleware_1.authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const authReq = req;
        const file = req.file;
        if (!file) {
            res.status(400).json({
                success: false,
                message: 'Fayl tanlanmagan'
            });
            return;
        }
        const { messageId } = req.body;
        const uploadedFile = await file_service_1.fileService.uploadFile(file, authReq.user.userId, messageId);
        res.status(201).json({
            success: true,
            file: uploadedFile
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Fayl yuklashda xatolik'
        });
    }
});
// GET /api/files/:id - Get file info
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const file = await file_service_1.fileService.getFileById(id);
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
    }
    catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
// GET /api/files/:id/download - Download file (public - no auth required for media)
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📥 Download request for file:', id);
        const file = await file_service_1.fileService.getFileById(id);
        if (!file) {
            console.log('❌ File not found in database:', id);
            res.status(404).json({
                success: false,
                message: 'Fayl topilmadi'
            });
            return;
        }
        console.log('📁 File found:', file.filename, file.mimeType);
        const filePath = file_service_1.fileService.getFilePath(file.filename);
        if (!fs_1.default.existsSync(filePath)) {
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
        }
        else {
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        }
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 yil cache
        res.setHeader('Accept-Ranges', 'bytes'); // Video streaming uchun
        console.log('✅ Sending file:', filePath);
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
// DELETE /api/files/:id - Delete file
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        await file_service_1.fileService.deleteFile(id, authReq.user.userId);
        res.json({
            success: true,
            message: 'Fayl o\'chirildi'
        });
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Server xatosi'
        });
    }
});
exports.default = router;
