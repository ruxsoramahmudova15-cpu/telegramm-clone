import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Log error
  logger.error('Request error', err, {
    method: req.method,
    url: req.url,
    statusCode,
    isOperational
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Server xatosi yuz berdi',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'So\'ralgan resurs topilmadi'
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};