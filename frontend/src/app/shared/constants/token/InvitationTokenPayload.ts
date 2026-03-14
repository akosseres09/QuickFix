import { BaseTokenPayload } from './BaseTokenPayload';

export interface InvitationTokenPayload extends BaseTokenPayload {
    email: string;
    organizationId: string;
    emailExists: boolean;
}
