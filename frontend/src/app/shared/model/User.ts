import { BaseModel } from './BaseModel';

export const DELETED = 0;
export const INACTIVE = 9;
export const ACTIVE = 10;
export const SYS_ADMIN = 2;
export const ADMIN = 1;
export const USER = 0;

export interface User extends BaseModel {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    dateOfBirth: string | null;
    profilePictureUrl: string;
    status: typeof DELETED | typeof INACTIVE | typeof ACTIVE;
    isAdmin: typeof ADMIN | typeof USER | typeof SYS_ADMIN;
    authKey?: string;
    passwordHash?: string;
    passwordResetToken?: string;
    createdAt: number;
    updatedAt: number | null;
    deletedAt: number | null;
    verificationToken?: string;
}
