import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';
import { caseInterceptor } from './case.interceptor';

describe('caseInterceptor', () => {
    const interceptor: HttpInterceptorFn = (req, next) =>
        TestBed.runInInjectionContext(() => caseInterceptor(req, next));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(interceptor).toBeTruthy();
    });

    // ==================== Body conversion ====================

    describe('body conversion to snake_case', () => {
        it('should convert camelCase body keys to snake_case', (done) => {
            const req = new HttpRequest('POST', '/api/test', {
                firstName: 'John',
                lastName: 'Doe',
            });
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toEqual({ first_name: 'John', last_name: 'Doe' });
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should convert nested camelCase keys', (done) => {
            const req = new HttpRequest('POST', '/api/test', {
                userInfo: { firstName: 'Jane' },
            });
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toEqual({
                    user_info: { first_name: 'Jane' },
                });
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should convert arrays of objects', (done) => {
            const req = new HttpRequest('POST', '/api/test', {
                items: [{ itemName: 'A' }, { itemName: 'B' }],
            });
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toEqual({
                    items: [{ item_name: 'A' }, { item_name: 'B' }],
                });
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should handle an empty object body', (done) => {
            const req = new HttpRequest('POST', '/api/test', {});
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toEqual({});
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should preserve primitive values while converting keys', (done) => {
            const req = new HttpRequest('POST', '/api/test', {
                isActive: true,
                itemCount: 5,
                userName: null,
            });
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toEqual({
                    is_active: true,
                    item_count: 5,
                    user_name: null,
                });
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });
    });

    // ==================== Pass-through scenarios ====================

    describe('pass-through (no conversion)', () => {
        it('should not convert FormData body', (done) => {
            const formData = new FormData();
            formData.append('firstName', 'John');
            const req = new HttpRequest('POST', '/api/upload', formData);
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toBeInstanceOf(FormData);
                expect(r.body).toBe(formData);
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should pass through when body is null', (done) => {
            const req = new HttpRequest('GET', '/api/test');
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toBeNull();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should pass through GET requests (no body)', (done) => {
            const req = new HttpRequest('GET', '/api/items');
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toBeNull();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should pass through DELETE requests (no body)', (done) => {
            const req = new HttpRequest('DELETE', '/api/items/1');
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toBeNull();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });
    });

    // ==================== Immutability ====================

    describe('immutability', () => {
        it('should clone the request, not mutate the original', (done) => {
            const originalBody = { firstName: 'John' };
            const req = new HttpRequest('POST', '/api/test', originalBody);
            const next: HttpHandlerFn = (r) => {
                expect(r).not.toBe(req);
                expect(originalBody).toEqual({ firstName: 'John' }); // not mutated
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });
    });
});
