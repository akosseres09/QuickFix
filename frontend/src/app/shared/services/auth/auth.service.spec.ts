import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { SignupData } from '../../constants/user/SignupData';

/** Build a minimal valid JWT with the given payload */
function fakeJwt(payload: object): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fake-sig`;
}

describe('AuthService', () => {
    let service: AuthService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(AuthService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTesting.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== signup ====================

    describe('signup', () => {
        it('should POST signup data with snake_case field mapping', () => {
            const data: SignupData = {
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                email: 'john@example.com',
                password: 'secret123',
                confirmPassword: 'secret123',
                dateOfBirth: '1990-01-01',
                phoneNumber: '555-1234',
            };

            service.signup(data).subscribe();

            const req = httpTesting.expectOne('/auth/signup');
            expect(req.request.method).toBe('POST');
            expect(req.request.body.first_name).toBe('John');
            expect(req.request.body.last_name).toBe('Doe');
            expect(req.request.body.date_of_birth).toBe('1990-01-01');
            expect(req.request.body.phone_number).toBe('555-1234');
            expect(req.request.headers.get('Content-Type')).toBe('application/json');
            req.flush({ success: true });
        });
    });

    // ==================== verify ====================

    describe('verify', () => {
        it('should POST the verification token', () => {
            service.verify('abc-token').subscribe();

            const req = httpTesting.expectOne('/auth/verify');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ token: 'abc-token' });
            req.flush({ success: true });
        });
    });

    // ==================== resendEmail ====================

    describe('resendEmail', () => {
        it('should POST to the default resend link', () => {
            service.resendEmail('john@example.com').subscribe();

            const req = httpTesting.expectOne('/auth/resend-verification-email');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ email: 'john@example.com' });
            req.flush({ success: true });
        });

        it('should use custom link when provided', () => {
            service.resendEmail('john@example.com', '/auth/custom-resend').subscribe();

            const req = httpTesting.expectOne('/auth/custom-resend');
            expect(req.request.body).toEqual({ email: 'john@example.com' });
            req.flush({ success: true });
        });
    });

    // ==================== resetPassword ====================

    describe('resetPassword', () => {
        it('should POST token and new password', () => {
            service.resetPassword('reset-token', 'newPass123').subscribe();

            const req = httpTesting.expectOne('/auth/reset-password');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ token: 'reset-token', password: 'newPass123' });
            req.flush({ success: true });
        });
    });

    // ==================== login ====================

    describe('login', () => {
        it('should POST credentials and store access token', () => {
            const token = fakeJwt({ uid: 'user-1', email: 'john@example.com', role: 'user' });

            service.login('john@example.com', 'secret').subscribe();

            const req = httpTesting.expectOne('/auth/login');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ email: 'john@example.com', password: 'secret' });
            req.flush({ access_token: token });

            expect(localStorage.getItem('access_token')).toBe(token);
        });

        it('should update currentUserClaims signal after login', () => {
            const token = fakeJwt({ uid: 'user-1', email: 'john@example.com', role: 'user' });

            service.login('john@example.com', 'secret').subscribe();

            httpTesting.expectOne('/auth/login').flush({ access_token: token });

            const claims = service.currentUserClaims();
            expect(claims).toBeTruthy();
            expect(claims!.uid).toBe('user-1');
        });

        it('should not store token when response has no access_token', () => {
            service.login('john@example.com', 'wrong').subscribe();

            httpTesting.expectOne('/auth/login').flush({ error: 'invalid' });

            expect(localStorage.getItem('access_token')).toBeNull();
        });
    });

    // ==================== refresh ====================

    describe('refresh', () => {
        it('should GET refresh endpoint with credentials and store new token', () => {
            const newToken = fakeJwt({ uid: 'user-1', email: 'john@example.com', role: 'user' });

            service.refresh().subscribe();

            const req = httpTesting.expectOne('/auth/refresh');
            expect(req.request.method).toBe('GET');
            expect(req.request.withCredentials).toBeTrue();
            req.flush({ access_token: newToken });

            expect(localStorage.getItem('access_token')).toBe(newToken);
        });
    });

    // ==================== logout ====================

    describe('logout', () => {
        it('should POST to logout and clear token and claims', () => {
            localStorage.setItem('access_token', 'old-token');

            service.logout().subscribe();

            const req = httpTesting.expectOne('/auth/logout');
            expect(req.request.method).toBe('POST');
            expect(req.request.withCredentials).toBeTrue();
            req.flush({});

            expect(localStorage.getItem('access_token')).toBeNull();
            expect(service.currentUserClaims()).toBeNull();
        });
    });

    // ==================== me ====================

    describe('me', () => {
        it('should GET /auth/me with no params', () => {
            service.me().subscribe();

            const req = httpTesting.expectOne('/auth/me');
            expect(req.request.method).toBe('GET');
            req.flush({ id: 'user-1' });
        });

        it('should include organizationId and projectId when provided', () => {
            service.me('org-1', 'proj-1').subscribe();

            const req = httpTesting.expectOne((r) => r.url === '/auth/me');
            expect(req.request.params.get('organizationId')).toBe('org-1');
            expect(req.request.params.get('projectId')).toBe('proj-1');
            req.flush({ id: 'user-1' });
        });

        it('should omit null params', () => {
            service.me(null, null).subscribe();

            const req = httpTesting.expectOne('/auth/me');
            expect(req.request.params.keys().length).toBe(0);
            req.flush({ id: 'user-1' });
        });
    });

    // ==================== permissions ====================

    describe('permissions', () => {
        it('should GET permissions with credentials', () => {
            service.permissions('org-1', 'proj-1').subscribe();

            const req = httpTesting.expectOne((r) => r.url === '/auth/permissions');
            expect(req.request.method).toBe('GET');
            expect(req.request.withCredentials).toBeTrue();
            expect(req.request.params.get('organizationId')).toBe('org-1');
            expect(req.request.params.get('projectId')).toBe('proj-1');
            req.flush({ permissions: {} });
        });

        it('should omit null params', () => {
            service.permissions(null, null).subscribe();

            const req = httpTesting.expectOne('/auth/permissions');
            expect(req.request.params.keys().length).toBe(0);
            req.flush({ permissions: {} });
        });
    });

    // ==================== fetchPermissions (dedup) ====================

    describe('fetchPermissions', () => {
        it('should deduplicate concurrent calls with the same key', () => {
            let callCount = 0;

            service.fetchPermissions('org-1', 'proj-1').subscribe(() => callCount++);
            service.fetchPermissions('org-1', 'proj-1').subscribe(() => callCount++);

            // Should only make ONE HTTP request
            const reqs = httpTesting.match((r) => r.url === '/auth/permissions');
            expect(reqs.length).toBe(1);
            reqs[0].flush({ permissions: {} });

            expect(callCount).toBe(2);
        });

        it('should make separate requests for different keys', () => {
            service.fetchPermissions('org-1', null).subscribe();
            service.fetchPermissions('org-2', null).subscribe();

            const reqs = httpTesting.match((r) => r.url === '/auth/permissions');
            expect(reqs.length).toBe(2);
            reqs.forEach((r) => r.flush({ permissions: {} }));
        });
    });

    // ==================== token helpers ====================

    describe('token helpers', () => {
        it('getAccessToken should return stored token', () => {
            localStorage.setItem('access_token', 'my-token');
            expect(service.getAccessToken()).toBe('my-token');
        });

        it('getAccessToken should return null when no token', () => {
            expect(service.getAccessToken()).toBeNull();
        });

        it('removeAccessToken should clear the token', () => {
            localStorage.setItem('access_token', 'my-token');
            service.removeAccessToken();
            expect(localStorage.getItem('access_token')).toBeNull();
        });
    });

    // ==================== setClaimsFromResponse ====================

    describe('setClaimsFromResponse', () => {
        it('should set claims from response data', () => {
            service.setClaimsFromResponse({
                id: 'user-1',
                email: 'john@example.com',
                role: { name: 'admin', value: 1 },
            });

            const claims = service.currentUserClaims();
            expect(claims!.uid).toBe('user-1');
            expect(claims!.email).toBe('john@example.com');
        });

        it('should clear claims when null is passed', () => {
            service.setClaimsFromResponse({ id: 'user-1', email: 'a@b.com', role: 'user' });
            service.setClaimsFromResponse(null);

            expect(service.currentUserClaims()).toBeNull();
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate 401 on login failure', () => {
            service.login('bad@example.com', 'wrong').subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(401),
            });

            httpTesting
                .expectOne('/auth/login')
                .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
        });

        it('should propagate 422 on signup validation error', () => {
            const data: SignupData = {
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
            };

            service.signup(data).subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(422),
            });

            httpTesting
                .expectOne('/auth/signup')
                .flush('Validation error', { status: 422, statusText: 'Unprocessable Entity' });
        });
    });
});
