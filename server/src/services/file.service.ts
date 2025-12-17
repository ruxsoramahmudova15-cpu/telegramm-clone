import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { FileAttachment } from '../models';
import { mockDb } from '../config/database';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const USE_MOCK = process.env.USE_MOCK === 'true';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export interface FileData {
  id: string;
  messageId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  filePath: string;
  createdAt: Date;
  downloadUrl: string;
}

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

export class FileService {
  validateFile(file: any): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return { valid: false, error: 'Bu fayl turi qo\'llab-quvvatlanmaydi' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'Fayl hajmi 50MB dan oshmasligi kerak' };
    }
    return { valid: true };
  }

  async uploadFile(file: any, userId: string, messageId?: string): Promise<FileData> {
    const validation = this.validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, file.buffer);

    if (USE_MOCK) {
      const fileData = { id: fileId, messageId, filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, uploadedBy: userId, filePath, createdAt: new Date(), downloadUrl: `/api/files/${fileId}/download` };
      mockDb.contacts.set(fileId, fileData); // reusing contacts map for files in mock
      return fileData;
    }

    const attachment = await FileAttachment.create({
      messageId, filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, uploadedBy: userId, filePath
    });

    return this.formatFile(attachment);
  }

  async getFileById(fileId: string): Promise<FileData | null> {
    if (USE_MOCK) {
      return mockDb.contacts.get(fileId) || null;
    }
    const file = await FileAttachment.findById(fileId);
    return file ? this.formatFile(file) : null;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    if (USE_MOCK) {
      const file = mockDb.contacts.get(fileId);
      if (!file) throw new Error('Fayl topilmadi');
      if (file.uploadedBy !== userId) throw new Error('Bu faylni o\'chirish huquqingiz yo\'q');
      if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
      mockDb.contacts.delete(fileId);
      return;
    }

    const file = await FileAttachment.findById(fileId);
    if (!file) throw new Error('Fayl topilmadi');
    if (file.uploadedBy.toString() !== userId) throw new Error('Bu faylni o\'chirish huquqingiz yo\'q');
    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
    await FileAttachment.findByIdAndDelete(fileId);
  }

  getFilePath(filename: string): string {
    return path.join(UPLOAD_DIR, filename);
  }

  private formatFile(file: any): FileData {
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

export const fileService = new FileService();
