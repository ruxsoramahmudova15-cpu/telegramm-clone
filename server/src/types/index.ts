export interface User {
  id: string;
  username: string;
  phone: string;
  displayName: string;
  profilePicture?: string;
  lastSeen: Date;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendOTPRequest {
  phone: string;
  displayName?: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'passwordHash'>;
  token?: string;
}

export interface JWTPayload {
  userId: string;
  phone: string;
  username: string;
}