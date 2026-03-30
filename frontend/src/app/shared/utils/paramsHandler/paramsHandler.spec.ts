import { HttpParams } from '@angular/common/http';
import { ParamsHandler } from './paramsHandler';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';

describe('ParamsHandler', () => {
    describe('convertToHttpParams', () => {
        it('should convert a simple params object to HttpParams', () => {
            const params: ApiQueryParams = { page: 1, pageSize: 10 };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('page')).toBe('1');
            expect(result.get('pageSize')).toBe('10');
        });

        it('should convert sort and expand params', () => {
            const params: ApiQueryParams = { sort: '-createdAt', expand: 'owner,members' };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('sort')).toBe('-createdAt');
            expect(result.get('expand')).toBe('owner,members');
        });

        it('should skip null values', () => {
            const params: ApiQueryParams = { page: 1, sort: null };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('page')).toBe('1');
            expect(result.has('sort')).toBeFalse();
        });

        it('should skip undefined values', () => {
            const params: ApiQueryParams = { page: 1, sort: undefined };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('page')).toBe('1');
            expect(result.has('sort')).toBeFalse();
        });

        it('should skip empty string values', () => {
            const params: ApiQueryParams = { page: 1, sort: '' };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('page')).toBe('1');
            expect(result.has('sort')).toBeFalse();
        });

        it('should include boolean values', () => {
            const params: ApiQueryParams = { active: true };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('active')).toBe('true');
        });

        it('should include false boolean values', () => {
            const params: ApiQueryParams = { active: false };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('active')).toBe('false');
        });

        it('should include zero as a valid number', () => {
            const params: ApiQueryParams = { page: 0 };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('page')).toBe('0');
        });

        it('should handle an empty object', () => {
            const result = ParamsHandler.convertToHttpParams({});
            expect(result.keys().length).toBe(0);
        });

        it('should handle custom dynamic filter keys', () => {
            const params: ApiQueryParams = { status: 'open', priority: 'high' };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('status')).toBe('open');
            expect(result.get('priority')).toBe('high');
        });

        it('should return an instance of HttpParams', () => {
            const result = ParamsHandler.convertToHttpParams({ page: 1 });
            expect(result).toBeInstanceOf(HttpParams);
        });

        it('should convert number values to strings', () => {
            const params: ApiQueryParams = { page: 5, pageSize: 25 };
            const result = ParamsHandler.convertToHttpParams(params);

            // HttpParams always stores strings
            expect(result.get('page')).toBe('5');
            expect(result.get('pageSize')).toBe('25');
        });

        it('should include string values as-is', () => {
            const params: ApiQueryParams = { expand: 'labels' };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.get('expand')).toBe('labels');
        });

        it('should handle many mixed params correctly', () => {
            const params: ApiQueryParams = {
                page: 2,
                pageSize: 50,
                sort: 'name',
                expand: 'owner',
                status: 'active',
                archived: false,
                priority: null,
                label: undefined,
                search: '',
            };
            const result = ParamsHandler.convertToHttpParams(params);

            expect(result.keys().length).toBe(6);
            expect(result.get('page')).toBe('2');
            expect(result.get('pageSize')).toBe('50');
            expect(result.get('sort')).toBe('name');
            expect(result.get('expand')).toBe('owner');
            expect(result.get('status')).toBe('active');
            // false is truthy-ish for the check `value !== null && value !== undefined && value !== ''`
            // Actually false is a valid value, but let's verify it's included
        });
    });
});
