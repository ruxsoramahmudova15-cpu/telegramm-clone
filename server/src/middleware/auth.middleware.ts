import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { JWTPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const decoded = await authService.validateToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Token yaroqsiz yoki muddati tugagan'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};