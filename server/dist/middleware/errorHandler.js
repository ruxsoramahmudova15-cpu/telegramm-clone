"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;
    // Log error
    logger_1.logger.error('Request error', err, {
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
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'So\'ralgan resurs topilmadi'
    });
};
exports.notFoundHandler = notFoundHandler;
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
