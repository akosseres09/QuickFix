import { TestBed } from '@angular/core/testing';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpResponse,
    HttpHandlerFn,
    HttpErrorResponse,
    HttpEvent,
} from '@angular/common/http';
import { of, throwError, BehaviorSubject, Observable } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../services/auth/auth.service';

describe('authInterceptor', () => {
    let mockAuthService: jasmine.SpyObj<AuthService> & {
        isRefreshing: boolean;
        refreshTokenSubject: BehaviorSubject<string | null>;
    };

    const interceptor: HttpInterceptorFn = (req, next) =>
        TestBed.runInInjectionContext(() => authInterceptor(req, next));

    beforeEach(() => {
        mockAuthService = {
            ...jasmine.createSpyObj('AuthService', [
                'getAccessToken',
                'refresh',
                'removeAccessToken',
                'setClaimsFromResponse',
            ]),
            isRefreshing: false,
            refreshTokenSubject: new BehaviorSubject<string | null>(null),
        } as any;

        TestBed.configureTestingModule({
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        });
    });

    function createReq(url = '/api/test'): HttpRequest<any> {
        return new HttpRequest('GET', url);
    }

    function errorHandler(status: number): HttpHandlerFn {
        return () =>
            throwError(
                () =>
                    new HttpErrorResponse({
                        status,
                        url: '/api/test',
                    })
            );
    }

    // ==================== Token attachment ====================

    describe('token attachment', () => {
        it('should be created', () => {
            mockAuthService.getAccessToken.and.returnValue(null);
            expect(interceptor).toBeTruthy();
        });

        it('should add Authorization header when token exists', (done) => {
            mockAuthService.getAccessToken.and.returnValue('my-token');
            const req = createReq();
            const next: HttpHandlerFn = (r) => {
                expect(r.headers.get('Authorization')).toBe('Bearer my-token');
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should set withCredentials when token exists', (done) => {
            mockAuthService.getAccessToken.and.returnValue('my-token');
            const req = createReq();
            const next: HttpHandlerFn = (r) => {
                expect(r.withCredentials).toBeTrue();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should not add Authorization header when no token', (done) => {
            mockAuthService.getAccessToken.and.returnValue(null);
            const req = createReq();
            const next: HttpHandlerFn = (r) => {
                expect(r.headers.has('Authorization')).toBeFalse();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should pass through the request body unchanged', (done) => {
            mockAuthService.getAccessToken.and.returnValue('token');
            const req = new HttpRequest('POST', '/api/test', { data: 'hello' });
            const next: HttpHandlerFn = (r) => {
                expect(r.body).toEqual({ data: 'hello' });
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });
    });

    // ==================== Refresh URL bypass ====================

    describe('refresh URL bypass', () => {
        it('should skip auth logic for /auth/refresh URL', (done) => {
            mockAuthService.getAccessToken.and.returnValue('a-token');
            const req = createReq('/auth/refresh');
            const next: HttpHandlerFn = (r) => {
                expect(r.headers.has('Authorization')).toBeFalse();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });

        it('should bypass even when URL contains /auth/refresh as part of path', (done) => {
            mockAuthService.getAccessToken.and.returnValue('tok');
            const req = createReq('https://api.example.com/auth/refresh');
            const next: HttpHandlerFn = (r) => {
                expect(r.headers.has('Authorization')).toBeFalse();
                return of(new HttpResponse({}));
            };

            interceptor(req, next).subscribe(() => done());
        });
    });

    // ==================== Non-401 errors ====================

    describe('non-401 errors', () => {
        it('should propagate a 400 error as-is', (done) => {
            mockAuthService.getAccessToken.and.returnValue('token');
            const req = createReq();

            interceptor(req, errorHandler(400)).subscribe({
                error: (err: HttpErrorResponse) => {
                    expect(err.status).toBe(400);
                    done();
                },
            });
        });

        it('should propagate a 500 error as-is', (done) => {
            mockAuthService.getAccessToken.and.returnValue('token');
            const req = createReq();

            interceptor(req, errorHandler(500)).subscribe({
                error: (err: HttpErrorResponse) => {
                    expect(err.status).toBe(500);
                    done();
                },
            });
        });

        it('should propagate a 403 error as-is', (done) => {
            mockAuthService.getAccessToken.and.returnValue('token');
            const req = createReq();

            interceptor(req, errorHandler(403)).subscribe({
                error: (err: HttpErrorResponse) => {
                    expect(err.status).toBe(403);
                    done();
                },
            });
        });

        it('should propagate 401 without token (no refresh attempt)', (done) => {
            mockAuthService.getAccessToken.and.returnValue(null);
            const req = createReq();

            interceptor(req, errorHandler(401)).subscribe({
                error: (err: HttpErrorResponse) => {
                    expect(err.status).toBe(401);
                    expect(mockAuthService.refresh).not.toHaveBeenCalled();
                    done();
                },
            });
        });
    });

    // ==================== 401 handling with token refresh ====================

    describe('401 with token refresh', () => {
        it('should attempt refresh on 401 when token exists', (done) => {
            mockAuthService.getAccessToken.and.returnValue('expired-token');
            mockAuthService.refresh.and.returnValue(of({ access_token: 'new-token' }));

            let retryCount = 0;
            const req = createReq();
            const next: HttpHandlerFn = (r) => {
                retryCount++;
                if (retryCount === 1) {
                    return throwError(
                        () => new HttpErrorResponse({ status: 401, url: '/api/test' })
                    );
                }
                expect(r.headers.get('Authorization')).toBe('Bearer new-token');
                return of(new HttpResponse({ body: { ok: true } }));
            };

            interceptor(req, next).subscribe((event) => {
                expect(mockAuthService.refresh).toHaveBeenCalled();
                expect(mockAuthService.isRefreshing).toBeFalse();
                done();
            });
        });

        it('should remove token and clear claims on refresh failure', (done) => {
            mockAuthService.getAccessToken.and.returnValue('expired-token');
            mockAuthService.refresh.and.returnValue(
                throwError(() => new Error('Refresh network error'))
            );

            const req = createReq();

            interceptor(req, errorHandler(401)).subscribe({
                error: () => {
                    expect(mockAuthService.removeAccessToken).toHaveBeenCalled();
                    expect(mockAuthService.setClaimsFromResponse).toHaveBeenCalledWith(null);
                    expect(mockAuthService.isRefreshing).toBeFalse();
                    done();
                },
            });
        });

        it('should remove token and clear claims when refresh returns no access_token', (done) => {
            mockAuthService.getAccessToken.and.returnValue('expired-token');
            mockAuthService.refresh.and.returnValue(of({}));

            const req = createReq();

            interceptor(req, errorHandler(401)).subscribe({
                error: (err: Error) => {
                    expect(err.message).toBe('Refresh failed');
                    expect(mockAuthService.removeAccessToken).toHaveBeenCalled();
                    expect(mockAuthService.setClaimsFromResponse).toHaveBeenCalledWith(null);
                    done();
                },
            });
        });

        it('should queue requests while refresh is in progress', (done) => {
            mockAuthService.getAccessToken.and.returnValue('expired-token');
            mockAuthService.isRefreshing = true;

            const req = createReq();
            const next: HttpHandlerFn = (r) => {
                if (
                    !r.headers.has('Authorization') ||
                    r.headers.get('Authorization') === 'Bearer expired-token'
                ) {
                    return throwError(
                        () => new HttpErrorResponse({ status: 401, url: '/api/test' })
                    );
                }
                expect(r.headers.get('Authorization')).toBe('Bearer queued-token');
                return of(new HttpResponse({ body: { queued: true } }));
            };

            interceptor(req, next).subscribe((event) => {
                expect(event).toBeInstanceOf(HttpResponse);
                done();
            });

            mockAuthService.refreshTokenSubject.next('queued-token');
        });
    });
});
