import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'message' | 'group_invite' | 'mention' | 'system';
  title: string;
  body: string;
  data?: {
    conversationId?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['message', 'group_invite', 'mention', 'system'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: {
    conversationId: { type: String },
    messageId: { type: String },
    senderId: { type: String },
    senderName: { type: String }
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
