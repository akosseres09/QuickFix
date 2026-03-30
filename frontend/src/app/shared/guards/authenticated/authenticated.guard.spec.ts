import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { of, throwError, Observable, isObservable } from 'rxjs';

import { authenticatedGuard } from './authenticated.guard';
import { AuthService } from '../../services/auth/auth.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';

describe('authenticatedGuard', () => {
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let snackbarSpy: jasmine.SpyObj<SnackbarService>;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => authenticatedGuard(...guardParameters));

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj(
            'AuthService',
            ['getAccessToken', 'removeAccessToken', 'setClaimsFromResponse', 'refresh', 'me'],
            {
                currentUserClaims: jasmine.createSpy('currentUserClaims').and.returnValue(null),
            }
        );
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        snackbarSpy = jasmine.createSpyObj('SnackbarService', ['error']);

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SnackbarService, useValue: snackbarSpy },
            ],
        });

        route = {} as ActivatedRouteSnapshot;
        state = { url: '/dashboard' } as RouterStateSnapshot;
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    it('should return true immediately when user claims already exist', () => {
        authServiceSpy.currentUserClaims.and.returnValue({
            uid: 'u1',
            role: { name: 'user', value: 0 },
            email: 'a@b.com',
        });

        const result = executeGuard(route, state);
        expect(result).toBeTrue();
    });

    describe('when no claims and no access token (try refresh)', () => {
        beforeEach(() => {
            authServiceSpy.getAccessToken.and.returnValue(null);
        });

        it('should call refresh then me and set user data on success', (done) => {
            const meResponse = { id: 'u1', email: 'a@b.com', role: 'user' };
            authServiceSpy.refresh.and.returnValue(of({ access_token: 'new-token' }));
            authServiceSpy.me.and.returnValue(of(meResponse));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeTrue();
                expect(authServiceSpy.refresh).toHaveBeenCalled();
                expect(authServiceSpy.me).toHaveBeenCalled();
                expect(authServiceSpy.setClaimsFromResponse).toHaveBeenCalledWith(meResponse);
                done();
            });
        });

        it('should redirect to login when refresh fails', (done) => {
            authServiceSpy.refresh.and.returnValue(throwError(() => new Error('fail')));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeFalse();
                expect(authServiceSpy.removeAccessToken).toHaveBeenCalled();
                expect(authServiceSpy.setClaimsFromResponse).toHaveBeenCalledWith(null);
                expect(sessionStorage.getItem('redirectUrl')).toBe('/dashboard');
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
                expect(snackbarSpy.error).toHaveBeenCalledWith(
                    'Please log in to access this page.'
                );
                done();
            });
        });

        it('should redirect to login when refresh succeeds but me fails', (done) => {
            authServiceSpy.refresh.and.returnValue(of({ access_token: 'tok' }));
            authServiceSpy.me.and.returnValue(throwError(() => new Error('me fail')));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeFalse();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
                done();
            });
        });
    });

    describe('when no claims but access token exists (call me directly)', () => {
        beforeEach(() => {
            authServiceSpy.getAccessToken.and.returnValue('existing-token');
        });

        it('should call me and set user data on success', (done) => {
            const meResponse = { id: 'u1', email: 'a@b.com', role: 'user' };
            authServiceSpy.me.and.returnValue(of(meResponse));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeTrue();
                expect(authServiceSpy.refresh).not.toHaveBeenCalled();
                expect(authServiceSpy.setClaimsFromResponse).toHaveBeenCalledWith(meResponse);
                done();
            });
        });

        it('should redirect to login when me fails', (done) => {
            authServiceSpy.me.and.returnValue(throwError(() => new Error('unauthorized')));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeFalse();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
                expect(snackbarSpy.error).toHaveBeenCalled();
                done();
            });
        });
    });
});
