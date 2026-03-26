import { BaseTokenPayload } from './BaseTokenPayload';

export interface UserPayloadToken extends BaseTokenPayload {
    // user id (custom claim)
    uid: string;
    // role (custom claim)
    role: { name: string; value: number };
    // email (custom claim)
    email: string;
}
