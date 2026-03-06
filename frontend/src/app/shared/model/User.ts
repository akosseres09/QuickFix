import { BaseModel } from './BaseModel';

export enum UserStatus {
    DELETED = 0,
    INACTIVE = 9,
    ACTIVE = 10,
}

export enum UserRole {
    USER = 0,
    ADMIN = 1,
    SYS_ADMIN = 2,
}

export interface User extends BaseModel {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    dateOfBirth: string | null;
    profilePictureUrl: string;
    status: UserStatus;
    isAdmin: UserRole;
    authKey?: string;
    passwordHash?: string;
    passwordResetToken?: string;
    createdAt: number;
    updatedAt: number | null;
    deletedAt: number | null;
    verificationToken?: string;
}
