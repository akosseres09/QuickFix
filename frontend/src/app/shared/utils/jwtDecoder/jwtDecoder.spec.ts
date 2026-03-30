import { decodeToken } from './jwtDecoder';

/** Build a minimal JWT with the given payload */
function fakeJwt(payload: object): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fake-sig`;
}

describe('jwtDecoder – decodeToken', () => {
    it('should decode a valid JWT and return the payload', () => {
        const payload = { uid: 1, email: 'a@b.com', role: 'user' };
        const result = decodeToken<typeof payload>(fakeJwt(payload));
        expect(result).toEqual(payload);
    });

    it('should return the correct property types', () => {
        const payload = { uid: 42, active: true, name: 'Alice' };
        const result = decodeToken<typeof payload>(fakeJwt(payload));
        expect(result!.uid).toBe(42);
        expect(result!.active).toBe(true);
        expect(result!.name).toBe('Alice');
    });

    it('should handle a payload with nested objects', () => {
        const payload = { data: { nested: true } };
        const result = decodeToken<typeof payload>(fakeJwt(payload));
        expect(result!.data.nested).toBe(true);
    });

    it('should handle a payload with arrays', () => {
        const payload = { roles: ['admin', 'user'] };
        const result = decodeToken<typeof payload>(fakeJwt(payload));
        expect(result!.roles).toEqual(['admin', 'user']);
    });

    it('should handle an empty payload object', () => {
        const result = decodeToken<Record<string, never>>(fakeJwt({}));
        expect(result).toEqual({});
    });

    it('should return null for an invalid token string', () => {
        const result = decodeToken('not-a-jwt');
        expect(result).toBeNull();
    });

    it('should return null for an empty string', () => {
        const result = decodeToken('');
        expect(result).toBeNull();
    });

    it('should return null for a token with invalid base64 payload', () => {
        const result = decodeToken('header.!!!invalid!!!.signature');
        expect(result).toBeNull();
    });

    it('should return null when payload is valid base64 but not JSON', () => {
        const header = btoa(JSON.stringify({ alg: 'HS256' }));
        const body = btoa('not json');
        const result = decodeToken(`${header}.${body}.sig`);
        expect(result).toBeNull();
    });

    it('should not throw for any malformed input', () => {
        expect(() => decodeToken(null as any)).not.toThrow();
        expect(() => decodeToken(undefined as any)).not.toThrow();
        expect(() => decodeToken(123 as any)).not.toThrow();
    });

    it('should return null for null / undefined / number input', () => {
        expect(decodeToken(null as any)).toBeNull();
        expect(decodeToken(undefined as any)).toBeNull();
        expect(decodeToken(123 as any)).toBeNull();
    });

    it('should return null and log error for malformed token', () => {
        const consoleErrorSpy = spyOn(console, 'error').and.stub();
        const result = decodeToken('malformed.token.string');
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
