export const DELETED = 0;
export const INACTIVE = 9;
export const ACTIVE = 10;
export const ADMIN = 1;
export const USER = 0;

export interface User {
    id: string;
    username: string;
    email: string;
    status: number;
    auth_key?: string;
    password_hash?: string;
    password_reset_token?: string;
    created_at: Date;
    updated_at?: Date;
    verification_token?: string;
}
