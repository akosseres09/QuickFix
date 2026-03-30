import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { of, throwError, Observable } from 'rxjs';

import { invitationGuard } from './invitation.guard';
import { AuthService } from '../../services/auth/auth.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { OrganizationInvitationService } from '../../services/organization-invitation/organization-invitation.service';
import { UserService } from '../../services/user/user.service';

/** Build a minimal JWT-like token that decodeToken can parse */
function fakeJwt(payload: object): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fake-sig`;
}

function buildRoute(
    queryParams: Record<string, string> = {},
    firstChild?: ActivatedRouteSnapshot | null
): ActivatedRouteSnapshot {
    return {
        queryParams,
        firstChild: firstChild ?? null,
    } as unknown as ActivatedRouteSnapshot;
}

describe('invitationGuard', () => {
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let snackbarSpy: jasmine.SpyObj<SnackbarService>;
    let invitationServiceSpy: jasmine.SpyObj<OrganizationInvitationService>;
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let state: RouterStateSnapshot;

    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => invitationGuard(...guardParameters));

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        snackbarSpy = jasmine.createSpyObj('SnackbarService', ['error']);
        invitationServiceSpy = jasmine.createSpyObj('OrganizationInvitationService', [
            'setInvitationToken',
        ]);
        userServiceSpy = jasmine.createSpyObj('UserService', ['getUserByEmail']);

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SnackbarService, useValue: snackbarSpy },
                { provide: OrganizationInvitationService, useValue: invitationServiceSpy },
                { provide: UserService, useValue: userServiceSpy },
            ],
        });

        state = { url: '/invitation/accept?invitationToken=abc' } as RouterStateSnapshot;
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    // ==================== authenticated user ====================

    describe('when user is authenticated', () => {
        beforeEach(() => {
            authServiceSpy.getAccessToken.and.returnValue('existing-token');
        });

        it('should return true (let the authenticated user through)', () => {
            const token = fakeJwt({
                email: 'user@example.com',
                organizationId: 'org-1',
                emailExists: true,
            });
            const route = buildRoute({ invitationToken: token });

            const result = executeGuard(route, state);
            expect(result).toBeTrue();
        });

        it('should return true even when no invitation token in query params', () => {
            const route = buildRoute({});

            const result = executeGuard(route, state);
            expect(result).toBeTrue();
        });
    });

    // ==================== unauthenticated user ====================

    describe('when user is NOT authenticated', () => {
        beforeEach(() => {
            authServiceSpy.getAccessToken.and.returnValue(null);
        });

        it('should return true when no invitation token is present', () => {
            const route = buildRoute({});

            const result = executeGuard(route, state);
            expect(result).toBeTrue();
        });

        describe('with invitation token where emailExists is true', () => {
            it('should save token, redirect to login, and return false', () => {
                const token = fakeJwt({
                    email: 'existing@example.com',
                    organizationId: 'org-1',
                    emailExists: true,
                });
                const route = buildRoute({ invitationToken: token });

                const result = executeGuard(route, state);

                expect(result).toBeFalse();
                expect(invitationServiceSpy.setInvitationToken).toHaveBeenCalledWith(token);
                expect(sessionStorage.getItem('redirectUrl')).toBe(state.url);
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
                expect(snackbarSpy.error).toHaveBeenCalledWith('Please log in.');
            });
        });

        describe('with invitation token where emailExists is false', () => {
            const email = 'new@example.com';

            it('should redirect to login if getUserByEmail succeeds (user exists after all)', (done) => {
                const token = fakeJwt({
                    email,
                    organizationId: 'org-1',
                    emailExists: false,
                });
                const route = buildRoute({ invitationToken: token });

                userServiceSpy.getUserByEmail.and.returnValue(of({ id: 'u1' } as any));

                const result = executeGuard(route, state);
                (result as Observable<boolean>).subscribe((val) => {
                    expect(val).toBeFalse();
                    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
                    expect(snackbarSpy.error).toHaveBeenCalledWith('Please log in.');
                    expect(sessionStorage.getItem('redirectUrl')).toBe(state.url);
                    done();
                });
            });

            it('should redirect to signup if getUserByEmail fails (user does not exist)', (done) => {
                const token = fakeJwt({
                    email,
                    organizationId: 'org-1',
                    emailExists: false,
                });
                const route = buildRoute({ invitationToken: token });

                userServiceSpy.getUserByEmail.and.returnValue(
                    throwError(() => new Error('not found'))
                );

                const result = executeGuard(route, state);
                (result as Observable<boolean>).subscribe((val) => {
                    expect(val).toBeFalse();
                    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/signup']);
                    expect(snackbarSpy.error).toHaveBeenCalledWith(
                        'Please finish the registration to accept the invitation.'
                    );
                    expect(sessionStorage.getItem('redirectUrl')).toBe(state.url);
                    done();
                });
            });

            it('should save the invitation token before checking email', () => {
                const token = fakeJwt({
                    email,
                    organizationId: 'org-1',
                    emailExists: false,
                });
                const route = buildRoute({ invitationToken: token });

                userServiceSpy.getUserByEmail.and.returnValue(of({ id: 'u1' } as any));

                executeGuard(route, state);

                expect(invitationServiceSpy.setInvitationToken).toHaveBeenCalledWith(token);
            });
        });

        describe('token extraction from child routes', () => {
            it('should find invitation token in firstChild query params', () => {
                const token = fakeJwt({
                    email: 'child@example.com',
                    organizationId: 'org-1',
                    emailExists: true,
                });
                const child = buildRoute({ invitationToken: token });
                const route = buildRoute({}, child);

                const result = executeGuard(route, state);

                expect(result).toBeFalse();
                expect(invitationServiceSpy.setInvitationToken).toHaveBeenCalledWith(token);
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
            });
        });
    });
});
