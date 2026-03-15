export function decodeToken<T>(token: string): T | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (e) {
        console.error('Error decoding token', e);
        return null;
    }
}
