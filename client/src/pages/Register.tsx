import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Register sahifasi endi kerak emas - Login sahifasi orqali ro'yxatdan o'tiladi
export const Register: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};
