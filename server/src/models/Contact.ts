import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  nickname?: string;
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String },
}, { timestamps: true });

ContactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
