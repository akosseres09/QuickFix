import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
    let pipe: RelativeTimePipe;

    beforeEach(() => {
        pipe = new RelativeTimePipe();
    });

    it('should create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    // ==================== Falsy inputs ====================

    describe('falsy inputs', () => {
        it('should return empty string for empty string input', () => {
            expect(pipe.transform('')).toBe('');
        });

        it('should return empty string for null', () => {
            expect(pipe.transform(null as any)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(pipe.transform(undefined as any)).toBe('');
        });

        it('should return empty string for 0', () => {
            // 0 is falsy, so should return ''
            expect(pipe.transform(0 as any)).toBe('');
        });
    });

    // ==================== Seconds ago ====================

    describe('seconds', () => {
        it('should return "X seconds ago" for a date a few seconds in the past', () => {
            const date = new Date();
            date.setSeconds(date.getSeconds() - 10);
            const result = pipe.transform(date);
            expect(result).toMatch(/10 seconds ago/);
        });

        it('should return "now" or "0 seconds ago" for the current time', () => {
            const result = pipe.transform(new Date());
            // Intl.RelativeTimeFormat with numeric:'auto' returns 'now' for 0 seconds
            expect(result).toMatch(/now|0 seconds ago/);
        });

        it('should return "in X seconds" for a date a few seconds in the future', () => {
            const date = new Date();
            date.setSeconds(date.getSeconds() + 30);
            const result = pipe.transform(date);
            expect(result).toMatch(/in 30 seconds/);
        });
    });

    // ==================== Minutes ====================

    describe('minutes', () => {
        it('should return "X minutes ago" for a date several minutes in the past', () => {
            const date = new Date();
            date.setMinutes(date.getMinutes() - 5);
            const result = pipe.transform(date);
            expect(result).toMatch(/5 minutes ago/);
        });

        it('should return "1 minute ago" for exactly 1 minute ago', () => {
            const date = new Date();
            date.setMinutes(date.getMinutes() - 1);
            const result = pipe.transform(date);
            expect(result).toMatch(/1 minute ago/);
        });

        it('should return "in X minutes" for future dates', () => {
            const date = new Date();
            date.setMinutes(date.getMinutes() + 15);
            const result = pipe.transform(date);
            expect(result).toMatch(/in 15 minutes/);
        });
    });

    // ==================== Hours ====================

    describe('hours', () => {
        it('should return "X hours ago" for a date several hours in the past', () => {
            const date = new Date();
            date.setHours(date.getHours() - 3);
            const result = pipe.transform(date);
            expect(result).toMatch(/3 hours ago/);
        });

        it('should return "1 hour ago" for exactly 1 hour ago', () => {
            const date = new Date();
            date.setHours(date.getHours() - 1);
            const result = pipe.transform(date);
            expect(result).toMatch(/1 hour ago/);
        });
    });

    // ==================== Days ====================

    describe('days', () => {
        it('should return "yesterday" or "1 day ago" for 1 day ago', () => {
            const date = new Date();
            date.setDate(date.getDate() - 1);
            const result = pipe.transform(date);
            expect(result).toMatch(/yesterday|1 day ago/);
        });

        it('should return "X days ago" for several days in the past', () => {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            const result = pipe.transform(date);
            expect(result).toMatch(/7 days ago/);
        });

        it('should return "tomorrow" or "in 1 day" for 1 day in the future', () => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            const result = pipe.transform(date);
            expect(result).toMatch(/tomorrow|in 1 day/);
        });
    });

    // ==================== Months ====================

    describe('months', () => {
        it('should return "last month" or "1 month ago" for ~30 days ago', () => {
            const date = new Date();
            date.setDate(date.getDate() - 35);
            const result = pipe.transform(date);
            expect(result).toMatch(/month ago|last month/);
        });

        it('should return "X months ago" for several months ago', () => {
            const date = new Date();
            date.setMonth(date.getMonth() - 6);
            const result = pipe.transform(date);
            expect(result).toMatch(/months ago/);
        });
    });

    // ==================== Years ====================

    describe('years', () => {
        it('should return "last year" or "1 year ago" for ~365 days ago', () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 1);
            const result = pipe.transform(date);
            expect(result).toMatch(/year ago|last year/);
        });

        it('should return "X years ago" for several years ago', () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 5);
            const result = pipe.transform(date);
            expect(result).toMatch(/5 years ago/);
        });
    });

    // ==================== Input types ====================

    describe('input types', () => {
        it('should accept a Date object', () => {
            const date = new Date();
            date.setMinutes(date.getMinutes() - 10);
            expect(pipe.transform(date)).toBeTruthy();
        });

        it('should accept an ISO date string', () => {
            const date = new Date();
            date.setHours(date.getHours() - 2);
            expect(pipe.transform(date.toISOString())).toBeTruthy();
        });

        it('should accept a timestamp number', () => {
            const date = new Date();
            date.setDate(date.getDate() - 3);
            expect(pipe.transform(date.getTime())).toBeTruthy();
        });
    });
});
