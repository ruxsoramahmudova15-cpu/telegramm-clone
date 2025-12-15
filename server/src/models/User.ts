import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings {
  // Privacy settings
  lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
  profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  onlineStatusVisibility: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  // Notification settings
  messageNotifications: boolean;
  groupNotifications: boolean;
  notificationSound: boolean;
  notificationPreview: boolean;
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  chatBackground: string;
  accentColor: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  phone: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  // Privacy
  lastSeenVisibility: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
  profilePhotoVisibility: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
  onlineStatusVisibility: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
  readReceipts: { type: Boolean, default: true },
  // Notifications
  messageNotifications: { type: Boolean, default: true },
  groupNotifications: { type: Boolean, default: true },
  notificationSound: { type: Boolean, default: true },
  notificationPreview: { type: Boolean, default: true },
  // Theme
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
  chatBackground: { type: String, default: '' },
  accentColor: { type: String, default: '#5ca0d3' },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  profilePicture: { type: String },
  bio: { type: String },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  settings: { type: UserSettingsSchema, default: () => ({}) },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
