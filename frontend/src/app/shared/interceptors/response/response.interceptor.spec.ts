import { TestBed } from '@angular/core/testing';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpResponse,
    HttpHandlerFn,
    HttpEvent,
} from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { responseInterceptor } from './response.interceptor';

describe('responseInterceptor', () => {
    const interceptor: HttpInterceptorFn = (req, next) =>
        TestBed.runInInjectionContext(() => responseInterceptor(req, next));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(interceptor).toBeTruthy();
    });

    function run(body: any): Observable<HttpEvent<unknown>> {
        const req = new HttpRequest('GET', '/api/test');
        const next: HttpHandlerFn = () => of(new HttpResponse({ body }));
        return interceptor(req, next);
    }

    // ==================== Single object responses ====================

    describe('single object unwrapping', () => {
        it('should unwrap { success: true, data: { ... } } to the data object', (done) => {
            const data = { id: 1, name: 'Test' };
            run({ success: true, data }).subscribe((event) => {
                expect(event).toBeInstanceOf(HttpResponse);
                expect((event as HttpResponse<any>).body).toEqual(data);
                done();
            });
        });

        it('should unwrap nested data objects', (done) => {
            const data = { id: 1, details: { key: 'value' } };
            run({ success: true, data }).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toEqual(data);
                done();
            });
        });

        it('should unwrap data that is a string', (done) => {
            run({ success: true, data: 'token-string' }).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toBe('token-string');
                done();
            });
        });

        it('should unwrap data that is a number', (done) => {
            run({ success: true, data: 42 }).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toBe(42);
                done();
            });
        });

        it('should unwrap data that is null', (done) => {
            run({ success: true, data: null }).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toBeNull();
                done();
            });
        });
    });

    // ==================== Non-paginated array responses ====================

    describe('non-paginated array unwrapping', () => {
        it('should unwrap { success: true, data: [] } to { items: [] }', (done) => {
            const data = [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ];
            run({ success: true, data }).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toEqual({ items: data });
                done();
            });
        });

        it('should handle an empty array', (done) => {
            run({ success: true, data: [] }).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toEqual({ items: [] });
                done();
            });
        });

        it('should not include _meta or _links when not present', (done) => {
            run({ success: true, data: [1, 2, 3] }).subscribe((event) => {
                const body = (event as HttpResponse<any>).body;
                expect(body).toEqual({ items: [1, 2, 3] });
                expect(body._meta).toBeUndefined();
                expect(body._links).toBeUndefined();
                done();
            });
        });
    });

    // ==================== Paginated array responses ====================

    describe('paginated array unwrapping', () => {
        it('should unwrap paginated response with _meta and _links', (done) => {
            const body = {
                success: true,
                data: [{ id: 1 }, { id: 2 }],
                _meta: { totalCount: 50, pageCount: 5, currentPage: 1, perPage: 10 },
                _links: { self: '/api/items?page=1', next: '/api/items?page=2' },
            };
            run(body).subscribe((event) => {
                const result = (event as HttpResponse<any>).body;
                expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
                expect(result._meta).toEqual(body._meta);
                expect(result._links).toEqual(body._links);
                done();
            });
        });

        it('should unwrap paginated response with _meta but no _links', (done) => {
            const body = {
                success: true,
                data: [{ id: 1 }],
                _meta: { totalCount: 1, pageCount: 1, currentPage: 1, perPage: 10 },
            };
            run(body).subscribe((event) => {
                const result = (event as HttpResponse<any>).body;
                expect(result.items).toEqual([{ id: 1 }]);
                expect(result._meta).toEqual(body._meta);
                expect(result._links).toBeUndefined();
                done();
            });
        });

        it('should include _links when present', (done) => {
            const body = {
                success: true,
                data: [],
                _meta: { totalCount: 0 },
                _links: { self: '/api/items?page=1' },
            };
            run(body).subscribe((event) => {
                const result = (event as HttpResponse<any>).body;
                expect(result._links).toEqual({ self: '/api/items?page=1' });
                done();
            });
        });
    });

    // ==================== Pass-through scenarios ====================

    describe('pass-through (no unwrapping)', () => {
        it('should pass through when success is false', (done) => {
            const body = { success: false, error: { message: 'Not found' } };
            run(body).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toEqual(body);
                done();
            });
        });

        it('should pass through when body has no success property', (done) => {
            const body = { id: 1, name: 'Raw response' };
            run(body).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toEqual(body);
                done();
            });
        });

        it('should pass through when body is null', (done) => {
            run(null).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toBeNull();
                done();
            });
        });

        it('should pass through when body is a string', (done) => {
            const req = new HttpRequest('GET', '/api/test');
            const next: HttpHandlerFn = () => of(new HttpResponse({ body: 'plain string' as any }));
            interceptor(req, next).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toBe('plain string');
                done();
            });
        });

        it('should pass through when body is a number', (done) => {
            const req = new HttpRequest('GET', '/api/test');
            const next: HttpHandlerFn = () => of(new HttpResponse({ body: 42 as any }));
            interceptor(req, next).subscribe((event) => {
                expect((event as HttpResponse<any>).body).toBe(42);
                done();
            });
        });

        it('should pass through non-HttpResponse events', (done) => {
            const req = new HttpRequest('GET', '/api/test');
            // HttpSentEvent is type 0 — just pass a plain object simulating a non-HttpResponse event
            const sentEvent = { type: 0 } as HttpEvent<unknown>;
            const next: HttpHandlerFn = () => of(sentEvent);
            interceptor(req, next).subscribe((event) => {
                expect(event).toBe(sentEvent);
                done();
            });
        });

        it('should pass through when success is true but data is missing', (done) => {
            // success: true with no data key — should still return the data node (undefined)
            const rawBody = { success: true };
            run(rawBody).subscribe((event) => {
                const body = (event as HttpResponse<any>).body;
                expect(body).toBe(rawBody);
                done();
            });
        });
    });
});
