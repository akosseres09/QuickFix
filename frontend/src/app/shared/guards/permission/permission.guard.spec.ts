import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { of, throwError, Observable } from 'rxjs';

import { permissionGuard } from './permission.guard';
import { AuthService } from '../../services/auth/auth.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { UserClaims } from '../../constants/user/Claims';
import { Permissions } from '../../constants/user/Permissions';

function buildRoute(
    data: Record<string, any>,
    params: Record<string, string> = {},
    parent?: ActivatedRouteSnapshot | null
): ActivatedRouteSnapshot {
    const route = {
        data,
        paramMap: {
            get: (key: string) => params[key] ?? null,
        },
        parent: parent ?? null,
    } as unknown as ActivatedRouteSnapshot;
    return route;
}

function buildClaims(permissions: Partial<Permissions> = {}): UserClaims {
    return new UserClaims('user-1', { name: 'user', value: 0 }, 'test@example.com', {
        base: [],
        org: {},
        project: {},
        ...permissions,
    });
}

describe('permissionGuard', () => {
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let snackbarSpy: jasmine.SpyObj<SnackbarService>;
    let state: RouterStateSnapshot;

    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => permissionGuard(...guardParameters));

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj(
            'AuthService',
            ['fetchPermissions', 'setPermissionsFromResponse'],
            {
                currentClaimsWithPermissions: jasmine
                    .createSpy('currentClaimsWithPermissions')
                    .and.returnValue(null),
            }
        );
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree'], {
            lastSuccessfulNavigation: null,
        });
        routerSpy.createUrlTree.and.callFake((commands: any[]) => {
            return { toString: () => commands.join('/') } as UrlTree;
        });
        snackbarSpy = jasmine.createSpyObj('SnackbarService', ['error']);

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SnackbarService, useValue: snackbarSpy },
            ],
        });

        state = { url: '/org/proj/settings' } as RouterStateSnapshot;
    });

    it('should return true when no permission is required in route data', () => {
        const route = buildRoute({});
        const result = executeGuard(route, state);
        expect(result).toBeTrue();
    });

    it('should return true when user already has permission in claims', () => {
        const claims = buildClaims({ org: { 'org-1': ['manage-project'] } });
        (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(claims);

        const parentRoute = buildRoute({}, { organizationId: 'org-1' });
        const route = buildRoute({ permission: 'manage-project' }, {}, parentRoute);

        const result = executeGuard(route, state);
        expect(result).toBeTrue();
    });

    it('should fetch permissions and allow when the fetched permissions grant access', (done) => {
        // Initially no permissions
        (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(null);

        const parentRoute = buildRoute({}, { organizationId: 'org-1' });
        const route = buildRoute({ permission: 'manage-project' }, {}, parentRoute);

        const fetchedResponse = {
            id: 'u1',
            role: 'user',
            permissions: { base: [], org: { 'org-1': ['manage-project'] }, project: {} },
        };
        authServiceSpy.fetchPermissions.and.returnValue(of(fetchedResponse));

        // After setPermissionsFromResponse is called, the claims should have the permission
        authServiceSpy.setPermissionsFromResponse.and.callFake(() => {
            const newClaims = buildClaims({ org: { 'org-1': ['manage-project'] } });
            (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(newClaims);
        });

        const result = executeGuard(route, state);
        (result as Observable<boolean | UrlTree>).subscribe((val) => {
            expect(val).toBeTrue();
            expect(authServiceSpy.fetchPermissions).toHaveBeenCalledWith('org-1', null);
            expect(authServiceSpy.setPermissionsFromResponse).toHaveBeenCalledWith(fetchedResponse);
            done();
        });
    });

    it('should deny access with snackbar when fetched permissions do not grant access', (done) => {
        (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(null);

        const route = buildRoute({ permission: 'admin-only' }, { organizationId: 'org-1' });

        authServiceSpy.fetchPermissions.and.returnValue(of({ permissions: {} }));
        authServiceSpy.setPermissionsFromResponse.and.callFake(() => {
            // Still no permissions after fetch
            (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(buildClaims());
        });

        const result = executeGuard(route, state);
        (result as Observable<boolean | UrlTree>).subscribe((val) => {
            // Direct navigation => returns UrlTree, not false
            expect(val).not.toBeTrue();
            expect(snackbarSpy.error).toHaveBeenCalledWith(
                "You don't have permission to access this page."
            );
            done();
        });
    });

    it('should deny access when fetchPermissions fails', (done) => {
        (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(null);

        const route = buildRoute({ permission: 'manage-project' }, { organizationId: 'org-1' });

        authServiceSpy.fetchPermissions.and.returnValue(
            throwError(() => new Error('network error'))
        );

        const result = executeGuard(route, state);
        (result as Observable<boolean | UrlTree>).subscribe((val) => {
            expect(val).not.toBeTrue();
            expect(snackbarSpy.error).toHaveBeenCalled();
            done();
        });
    });

    it('should crawl parent routes for organizationId and projectId', (done) => {
        (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(null);

        const grandparent = buildRoute({}, { organizationId: 'org-1' });
        const parent = buildRoute({}, { projectId: 'proj-1' }, grandparent);
        const route = buildRoute({ permission: 'edit-issue' }, {}, parent);

        authServiceSpy.fetchPermissions.and.returnValue(of({ permissions: {} }));
        authServiceSpy.setPermissionsFromResponse.and.callFake(() => {
            const newClaims = buildClaims({ project: { 'proj-1': ['edit-issue'] } });
            (authServiceSpy as any).currentClaimsWithPermissions.and.returnValue(newClaims);
        });

        const result = executeGuard(route, state);
        (result as Observable<boolean | UrlTree>).subscribe((val) => {
            expect(val).toBeTrue();
            expect(authServiceSpy.fetchPermissions).toHaveBeenCalledWith('org-1', 'proj-1');
            done();
        });
    });

    it('should return false (not UrlTree) when denied on non-direct navigation', (done) => {
        authServiceSpy.currentClaimsWithPermissions.and.returnValue(null);
        // Simulate non-direct navigation
        Object.defineProperty(routerSpy, 'lastSuccessfulNavigation', {
            value: {},
            writable: true,
        });

        const route = buildRoute({ permission: 'admin-only' }, { organizationId: 'org-1' });

        authServiceSpy.fetchPermissions.and.returnValue(of({ permissions: {} }));
        authServiceSpy.setPermissionsFromResponse.and.callFake(() => {
            authServiceSpy.currentClaimsWithPermissions.and.returnValue(buildClaims());
        });

        const result = executeGuard(route, state);
        (result as Observable<boolean | UrlTree>).subscribe((val) => {
            expect(val).toBeFalse();
            done();
        });
    });
});
