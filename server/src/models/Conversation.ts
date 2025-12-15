import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  picture?: string;
  participants: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  type: { type: String, enum: ['direct', 'group'], required: true },
  name: { type: String },
  description: { type: String },
  picture: { type: String },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
