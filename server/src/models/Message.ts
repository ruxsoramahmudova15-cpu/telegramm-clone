import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file', 'voice', 'video'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
