export interface BaseTokenPayload {
    // issuer
    iss: string;
    // audience
    aud: string;
    // jwt id
    jti: string;
    // issued at
    iat: number;
    // not before
    nbf: number;
    // expiration
    exp: number;
}
