import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models';
import { mockDb } from '../config/database';
import { AuthResponse, JWTPayload } from '../types';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = '7d';

const isMockMode = () => process.env.USE_MOCK === 'true';

// OTP kodlarni saqlash uchun
const otpStore = new Map<string, { code: string; expiresAt: Date; displayName?: string }>();
const OTP_EXPIRY_MINUTES = 5;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
  async sendOTP(phone: string, displayName?: string): Promise<{ success: boolean; message: string; isNewUser?: boolean }> {
    let existingUser: IUser | null = null;

    if (isMockMode()) {
      for (const user of mockDb.users.values()) {
        if (user.phone === phone) {
          existingUser = user;
          break;
        }
      }
    } else {
      existingUser = await User.findOne({ phone });
    }

    const isNewUser = !existingUser;
    
    if (isNewUser && !displayName) {
      return { success: true, message: 'Yangi foydalanuvchi', isNewUser: true };
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    otpStore.set(phone, { 
      code, 
      expiresAt,
      displayName: isNewUser ? displayName : existingUser?.displayName
    });

    console.log(`\n📱 ================================`);
    console.log(`📱 OTP kod ${phone} uchun: ${code}`);
    console.log(`📱 ================================\n`);

    return { success: true, message: `Tasdiqlash kodi ${phone} raqamiga yuborildi`, isNewUser };
  }

  async verifyOTP(phone: string, code: string): Promise<AuthResponse> {
    const otpData = otpStore.get(phone);

    if (!otpData) {
      return { success: false, message: 'Tasdiqlash kodi topilmadi. Qaytadan urinib ko\'ring.' };
    }

    if (new Date() > otpData.expiresAt) {
      otpStore.delete(phone);
      return { success: false, message: 'Tasdiqlash kodi muddati tugagan.' };
    }

    if (otpData.code !== code) {
      return { success: false, message: 'Tasdiqlash kodi noto\'g\'ri' };
    }

    otpStore.delete(phone);

    let user: any;
    const username = 'user_' + phone.replace(/\D/g, '').slice(-9);

    if (isMockMode()) {
      for (const u of mockDb.users.values()) {
        if (u.phone === phone) { user = u; break; }
      }
      if (!user) {
        const id = uuidv4();
        user = {
          id, _id: id,
          username,
          phone,
          displayName: otpData.displayName || 'Foydalanuvchi',
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockDb.users.set(id, user);
      } else {
        user.isOnline = true;
        user.lastSeen = new Date();
      }
    } else {
      // Telefon yoki username bo'yicha qidirish
      user = await User.findOne({ $or: [{ phone }, { username }] });
      if (!user) {
        try {
          user = await User.create({
            phone,
            username,
            displayName: otpData.displayName || 'Foydalanuvchi',
            isOnline: true,
            lastSeen: new Date()
          });
          console.log(`✅ Yangi foydalanuvchi yaratildi: ${user.displayName}`);
        } catch (err: any) {
          // Agar dublikat xatolik bo'lsa, mavjud foydalanuvchini topish
          if (err.code === 11000) {
            user = await User.findOne({ $or: [{ phone }, { username }] });
            if (user) {
              user.isOnline = true;
              user.lastSeen = new Date();
              await user.save();
            }
          } else {
            throw err;
          }
        }
      } else {
        // Telefon raqamni yangilash (agar username bo'yicha topilgan bo'lsa)
        if (user.phone !== phone) {
          user.phone = phone;
        }
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();
      }
    }

    if (!user) {
      return { success: false, message: 'Foydalanuvchi yaratishda xatolik' };
    }

    const token = this.generateToken(user);
    return { success: true, message: 'Tizimga muvaffaqiyatli kirdingiz', user: this.formatUser(user), token };
  }

  async logout(userId: string): Promise<AuthResponse> {
    if (isMockMode()) {
      const user = mockDb.users.get(userId);
      if (user) { user.isOnline = false; user.lastSeen = new Date(); }
    } else {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
    }
    return { success: true, message: 'Tizimdan muvaffaqiyatli chiqdingiz' };
  }

  async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch { return null; }
  }

  async getUserById(userId: string): Promise<any | null> {
    if (isMockMode()) {
      return mockDb.users.get(userId) || null;
    }
    const user = await User.findById(userId);
    return user ? this.formatUser(user) : null;
  }

  private generateToken(user: any): string {
    const payload: JWTPayload = {
      userId: user._id?.toString() || user.id,
      phone: user.phone,
      username: user.username
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  }

  private formatUser(user: any) {
    return {
      id: user._id?.toString() || user.id,
      phone: user.phone,
      username: user.username,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export const authService = new AuthService();
