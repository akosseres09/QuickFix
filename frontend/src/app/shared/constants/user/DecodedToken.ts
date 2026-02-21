export interface DecodedToken {
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
    // user id (custom claim)
    uid: string;
    // role (custom claim)
    role: string;
    // email (custom claim)
    email: string;
}
