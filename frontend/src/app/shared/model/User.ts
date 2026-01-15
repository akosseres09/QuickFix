import { BaseModel } from './BaseModel';

export const DELETED = 0;
export const INACTIVE = 9;
export const ACTIVE = 10;
export const SYS_ADMIN = 2;
export const ADMIN = 1;
export const USER = 0;

export interface User extends BaseModel {
    id: string;
    username: string;
    email: string;
    status: typeof DELETED | typeof INACTIVE | typeof ACTIVE;
    role: typeof ADMIN | typeof USER | typeof SYS_ADMIN;
    auth_key?: string;
    password_hash?: string;
    password_reset_token?: string;
    created_at: Date;
    updated_at?: Date;
    verification_token?: string;
}
