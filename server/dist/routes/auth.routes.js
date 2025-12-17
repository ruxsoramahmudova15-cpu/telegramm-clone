"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Telefon raqam validatsiyasi (soddalashtirilgan)
const phoneSchema = joi_1.default.object({
    phone: joi_1.default.string()
        .min(9)
        .max(20)
        .required()
        .messages({
        'string.min': 'Telefon raqam kamida 9 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Telefon raqam kiritilishi shart'
    }),
    displayName: joi_1.default.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
        'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ism 100 ta belgidan oshmasligi kerak'
    })
});
// OTP validatsiyasi (soddalashtirilgan)
const otpSchema = joi_1.default.object({
    phone: joi_1.default.string()
        .min(9)
        .max(20)
        .required()
        .messages({
        'any.required': 'Telefon raqam kiritilishi shart'
    }),
    code: joi_1.default.string()
        .length(6)
        .required()
        .messages({
        'string.length': 'Kod 6 ta raqamdan iborat bo\'lishi kerak',
        'any.required': 'Tasdiqlash kodi kiritilishi shart'
    })
});
// POST /api/auth/send-otp - Telefon raqamga OTP yuborish
router.post('/send-otp', async (req, res) => {
    try {
        const { error, value } = phoneSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validatsiya xatosi',
                errors: error.details.map((d) => d.message)
            });
            return;
        }
        const result = await auth_service_1.authService.sendOTP(value.phone, value.displayName);
        res.json(result);
    }
    catch (error) {
        console.error('Send OTP error:', error?.message || error);
        console.error('Stack:', error?.stack);
        res.status(500).json({
            success: false,
            message: 'Server xatosi: ' + (error?.message || 'Noma\'lum xatolik')
        });
    }
});
// POST /api/auth/verify-otp - OTP ni tekshirish va kirish
router.post('/verify-otp', async (req, res) => {
    try {
        const { error, value } = otpSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validatsiya xatosi',
                errors: error.details.map((d) => d.message)
            });
            return;
        }
        const result = await auth_service_1.authService.verifyOTP(value.phone, value.code);
        if (!result.success) {
            res.status(401).json(result);
            return;
        }
        res.json(result);
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
// POST /api/auth/logout
router.post('/logout', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Avtorizatsiya talab qilinadi'
            });
            return;
        }
        const result = await auth_service_1.authService.logout(req.user.userId);
        res.json(result);
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
// GET /api/auth/me
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Avtorizatsiya talab qilinadi'
            });
            return;
        }
        const user = await auth_service_1.authService.getUserById(req.user.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
            return;
        }
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});
exports.default = router;
