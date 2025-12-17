"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_service_1 = require("../services/auth.service");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Avtorizatsiya tokeni topilmadi'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = await auth_service_1.authService.validateToken(token);
        if (!decoded) {
            res.status(401).json({
                success: false,
                message: 'Token yaroqsiz yoki muddati tugagan'
            });
            return;
        }
        req.user = decoded;
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};
exports.authMiddleware = authMiddleware;
