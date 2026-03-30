import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { of, throwError, Observable } from 'rxjs';

import { unauthenticatedGuard } from './unauthenticated.guard';
import { AuthService } from '../../services/auth/auth.service';

describe('unauthenticatedGuard', () => {
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => unauthenticatedGuard(...guardParameters));

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj('AuthService', [
            'getAccessToken',
            'removeAccessToken',
            'setClaimsFromResponse',
            'me',
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        route = {} as ActivatedRouteSnapshot;
        state = { url: '/auth/login' } as RouterStateSnapshot;
    });

    it('should return true immediately when no access token exists', () => {
        authServiceSpy.getAccessToken.and.returnValue(null);

        const result = executeGuard(route, state);
        expect(result).toBeTrue();
        expect(authServiceSpy.me).not.toHaveBeenCalled();
    });

    describe('when access token exists', () => {
        beforeEach(() => {
            authServiceSpy.getAccessToken.and.returnValue('some-token');
        });

        it('should redirect to /organizations when me() succeeds (user is authenticated)', (done) => {
            authServiceSpy.me.and.returnValue(of({ id: 'u1' }));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeFalse();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/organizations']);
                done();
            });
        });

        it('should return true and clear token when me() fails (token is invalid)', (done) => {
            authServiceSpy.me.and.returnValue(throwError(() => new Error('expired')));

            const result = executeGuard(route, state);
            (result as Observable<boolean>).subscribe((val) => {
                expect(val).toBeTrue();
                expect(authServiceSpy.removeAccessToken).toHaveBeenCalled();
                expect(authServiceSpy.setClaimsFromResponse).toHaveBeenCalledWith(null);
                done();
            });
        });
    });
});
