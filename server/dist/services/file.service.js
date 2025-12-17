"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = exports.FileService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const models_1 = require("../models");
const database_1 = require("../config/database");
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
const USE_MOCK = process.env.USE_MOCK === 'true';
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    // Documents
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
    'application/json', 'application/xml',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/x-tar', 'application/gzip',
    // Videos
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac',
    // Other
    'application/octet-stream' // Generic binary
];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
class FileService {
    validateFile(file) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return { valid: false, error: 'Bu fayl turi qo\'llab-quvvatlanmaydi' };
        }
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: 'Fayl hajmi 50MB dan oshmasligi kerak' };
        }
        return { valid: true };
    }
    async uploadFile(file, userId, messageId) {
        const validation = this.validateFile(file);
        if (!validation.valid)
            throw new Error(validation.error);
        const fileId = (0, uuid_1.v4)();
        const ext = path_1.default.extname(file.originalname);
        const filename = `${fileId}${ext}`;
        const filePath = path_1.default.join(UPLOAD_DIR, filename);
        fs_1.default.writeFileSync(filePath, file.buffer);
        if (USE_MOCK) {
            const fileData = { id: fileId, messageId, filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, uploadedBy: userId, filePath, createdAt: new Date(), downloadUrl: `/api/files/${fileId}/download` };
            database_1.mockDb.contacts.set(fileId, fileData); // reusing contacts map for files in mock
            return fileData;
        }
        const attachment = await models_1.FileAttachment.create({
            messageId, filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, uploadedBy: userId, filePath
        });
        return this.formatFile(attachment);
    }
    async getFileById(fileId) {
        if (USE_MOCK) {
            return database_1.mockDb.contacts.get(fileId) || null;
        }
        const file = await models_1.FileAttachment.findById(fileId);
        return file ? this.formatFile(file) : null;
    }
    async deleteFile(fileId, userId) {
        if (USE_MOCK) {
            const file = database_1.mockDb.contacts.get(fileId);
            if (!file)
                throw new Error('Fayl topilmadi');
            if (file.uploadedBy !== userId)
                throw new Error('Bu faylni o\'chirish huquqingiz yo\'q');
            if (fs_1.default.existsSync(file.filePath))
                fs_1.default.unlinkSync(file.filePath);
            database_1.mockDb.contacts.delete(fileId);
            return;
        }
        const file = await models_1.FileAttachment.findById(fileId);
        if (!file)
            throw new Error('Fayl topilmadi');
        if (file.uploadedBy.toString() !== userId)
            throw new Error('Bu faylni o\'chirish huquqingiz yo\'q');
        if (fs_1.default.existsSync(file.filePath))
            fs_1.default.unlinkSync(file.filePath);
        await models_1.FileAttachment.findByIdAndDelete(fileId);
    }
    getFilePath(filename) {
        return path_1.default.join(UPLOAD_DIR, filename);
    }
    formatFile(file) {
        return {
            id: file._id.toString(),
            messageId: file.messageId?.toString(),
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            uploadedBy: file.uploadedBy.toString(),
            filePath: file.filePath,
            createdAt: file.createdAt,
            downloadUrl: `/api/files/${file._id}/download`
        };
    }
}
exports.FileService = FileService;
exports.fileService = new FileService();
