import mongoose, { Schema, Document } from 'mongoose';

export interface IFileAttachment extends Document {
  _id: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  filePath: string;
  createdAt: Date;
}

const FileAttachmentSchema = new Schema<IFileAttachment>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filePath: { type: String, required: true },
}, { timestamps: true });

export const FileAttachment = mongoose.model<IFileAttachment>('FileAttachment', FileAttachmentSchema);
