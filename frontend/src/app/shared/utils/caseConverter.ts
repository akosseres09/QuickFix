export function camelCaseToSnakeCase(key: string): string {
    return key.replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((item) => toSnakeCase(item));
    }

    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = camelCaseToSnakeCase(key);
            acc[snakeKey] = toSnakeCase(obj[key]);
            return acc;
        }, {} as any);
    }

    return obj;
}
