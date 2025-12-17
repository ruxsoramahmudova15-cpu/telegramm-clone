"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = '7d';
const isMockMode = () => process.env.USE_MOCK === 'true';
// OTP kodlarni saqlash uchun
const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 5;
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
class AuthService {
    async sendOTP(phone, displayName) {
        let existingUser = null;
        if (isMockMode()) {
            for (const user of database_1.mockDb.users.values()) {
                if (user.phone === phone) {
                    existingUser = user;
                    break;
                }
            }
        }
        else {
            existingUser = await models_1.User.findOne({ phone });
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
    async verifyOTP(phone, code) {
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
        let user;
        const username = 'user_' + phone.replace(/\D/g, '').slice(-9);
        if (isMockMode()) {
            for (const u of database_1.mockDb.users.values()) {
                if (u.phone === phone) {
                    user = u;
                    break;
                }
            }
            if (!user) {
                const id = (0, uuid_1.v4)();
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
                database_1.mockDb.users.set(id, user);
            }
            else {
                user.isOnline = true;
                user.lastSeen = new Date();
            }
        }
        else {
            // Telefon yoki username bo'yicha qidirish
            user = await models_1.User.findOne({ $or: [{ phone }, { username }] });
            if (!user) {
                try {
                    user = await models_1.User.create({
                        phone,
                        username,
                        displayName: otpData.displayName || 'Foydalanuvchi',
                        isOnline: true,
                        lastSeen: new Date()
                    });
                    console.log(`✅ Yangi foydalanuvchi yaratildi: ${user.displayName}`);
                }
                catch (err) {
                    // Agar dublikat xatolik bo'lsa, mavjud foydalanuvchini topish
                    if (err.code === 11000) {
                        user = await models_1.User.findOne({ $or: [{ phone }, { username }] });
                        if (user) {
                            user.isOnline = true;
                            user.lastSeen = new Date();
                            await user.save();
                        }
                    }
                    else {
                        throw err;
                    }
                }
            }
            else {
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
    async logout(userId) {
        if (isMockMode()) {
            const user = database_1.mockDb.users.get(userId);
            if (user) {
                user.isOnline = false;
                user.lastSeen = new Date();
            }
        }
        else {
            await models_1.User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        }
        return { success: true, message: 'Tizimdan muvaffaqiyatli chiqdingiz' };
    }
    async validateToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch {
            return null;
        }
    }
    async getUserById(userId) {
        if (isMockMode()) {
            return database_1.mockDb.users.get(userId) || null;
        }
        const user = await models_1.User.findById(userId);
        return user ? this.formatUser(user) : null;
    }
    generateToken(user) {
        const payload = {
            userId: user._id?.toString() || user.id,
            phone: user.phone,
            username: user.username
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    formatUser(user) {
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
