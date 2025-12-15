import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username faqat harf va raqamlardan iborat bo\'lishi kerak',
      'string.min': 'Username kamida 3 ta belgidan iborat bo\'lishi kerak',
      'string.max': 'Username 30 ta belgidan oshmasligi kerak',
      'any.required': 'Username kiritilishi shart'
    }),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{9,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Telefon raqam formati noto\'g\'ri (masalan: +998901234567)',
      'any.required': 'Telefon raqam kiritilishi shart'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      'string.max': 'Parol 128 ta belgidan oshmasligi kerak',
      'any.required': 'Parol kiritilishi shart'
    }),
  displayName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
      'string.max': 'Ism 100 ta belgidan oshmasligi kerak',
      'any.required': 'Ism kiritilishi shart'
    })
});

export const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[0-9]{9,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Telefon raqam formati noto\'g\'ri',
      'any.required': 'Telefon raqam kiritilishi shart'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Parol kiritilishi shart'
    })
});