export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type UserRole = "MEMBER" | "LIBRARIAN" | "ADMIN" | string;

export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | string;

export type MyProfile = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  maxBorrowLimit?: number;
  membershipExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateMyProfileRequest = {
  fullName: string;
  phone?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

export type ResendVerificationRequest = {
  email: string;
};

export type VerifyEmailCodeRequest = {
  email: string;
  code: string;
};
