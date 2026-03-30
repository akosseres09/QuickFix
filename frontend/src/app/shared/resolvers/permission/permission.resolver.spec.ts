import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, ResolveFn, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { permissionResolver } from './permission.resolver';
import { AuthService } from '../../services/auth/auth.service';

describe('permissionResolver', () => {
    let mockAuthService: jasmine.SpyObj<AuthService>;

    const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
        TestBed.runInInjectionContext(() => permissionResolver(...resolverParameters));

    beforeEach(() => {
        mockAuthService = jasmine.createSpyObj('AuthService', [
            'fetchPermissions',
            'setPermissionsFromResponse',
        ]);

        TestBed.configureTestingModule({
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        });
    });

    function createRoute(
        params: Record<string, string>,
        parentParams?: Record<string, string>
    ): ActivatedRouteSnapshot {
        const route = {
            paramMap: convertToParamMap(params),
            parent: parentParams
                ? {
                      paramMap: convertToParamMap(parentParams),
                      parent: null,
                  }
                : null,
        } as any as ActivatedRouteSnapshot;
        return route;
    }

    it('should be created', () => {
        expect(executeResolver).toBeTruthy();
    });

    // ==================== Successful permission fetch ====================

    describe('successful fetch', () => {
        it('should call fetchPermissions with orgId and projectId from route', (done) => {
            const route = createRoute({
                organizationId: 'org-1',
                projectId: 'proj-1',
            });
            const response = { id: 1, role: 'admin', permissions: ['read'] };
            mockAuthService.fetchPermissions.and.returnValue(of(response));

            (executeResolver(route, {} as any) as any).subscribe((result: boolean) => {
                expect(mockAuthService.fetchPermissions).toHaveBeenCalledWith('org-1', 'proj-1');
                expect(result).toBeTrue();
                done();
            });
        });

        it('should call setPermissionsFromResponse with the response', (done) => {
            const route = createRoute({ organizationId: 'org-1', projectId: 'proj-1' });
            const response = { id: 1, role: 'member', permissions: ['write'] };
            mockAuthService.fetchPermissions.and.returnValue(of(response));

            (executeResolver(route, {} as any) as any).subscribe(() => {
                expect(mockAuthService.setPermissionsFromResponse).toHaveBeenCalledWith(response);
                done();
            });
        });

        it('should return true on success', (done) => {
            const route = createRoute({ organizationId: 'org-1' });
            mockAuthService.fetchPermissions.and.returnValue(of({ permissions: [] }));

            (executeResolver(route, {} as any) as any).subscribe((result: boolean) => {
                expect(result).toBeTrue();
                done();
            });
        });
    });

    // ==================== Parameter extraction from parents ====================

    describe('parameter extraction from parent routes', () => {
        it('should extract organizationId from parent route', (done) => {
            const route = createRoute({}, { organizationId: 'parent-org' });
            mockAuthService.fetchPermissions.and.returnValue(of({}));

            (executeResolver(route, {} as any) as any).subscribe(() => {
                expect(mockAuthService.fetchPermissions).toHaveBeenCalledWith('parent-org', null);
                done();
            });
        });

        it('should extract projectId from parent route', (done) => {
            const route = createRoute({}, { projectId: 'parent-proj' });
            mockAuthService.fetchPermissions.and.returnValue(of({}));

            (executeResolver(route, {} as any) as any).subscribe(() => {
                expect(mockAuthService.fetchPermissions).toHaveBeenCalledWith(null, 'parent-proj');
                done();
            });
        });

        it('should prefer current route params over parent params', (done) => {
            const route = createRoute(
                { organizationId: 'child-org' },
                { organizationId: 'parent-org', projectId: 'parent-proj' }
            );
            mockAuthService.fetchPermissions.and.returnValue(of({}));

            (executeResolver(route, {} as any) as any).subscribe(() => {
                expect(mockAuthService.fetchPermissions).toHaveBeenCalledWith(
                    'child-org',
                    'parent-proj'
                );
                done();
            });
        });

        it('should pass null when no orgId or projectId found', (done) => {
            const route = createRoute({});
            mockAuthService.fetchPermissions.and.returnValue(of({}));

            (executeResolver(route, {} as any) as any).subscribe(() => {
                expect(mockAuthService.fetchPermissions).toHaveBeenCalledWith(null, null);
                done();
            });
        });
    });

    // ==================== Error handling ====================

    describe('error handling', () => {
        it('should return [false] on error', (done) => {
            const route = createRoute({ organizationId: 'org-1' });
            mockAuthService.fetchPermissions.and.returnValue(
                throwError(() => new Error('Network error'))
            );

            (executeResolver(route, {} as any) as any).subscribe((result: boolean) => {
                expect(result).toBeFalse();
                done();
            });
        });

        it('should clear permissions on error', (done) => {
            const route = createRoute({ organizationId: 'org-1' });
            mockAuthService.fetchPermissions.and.returnValue(
                throwError(() => new Error('Server error'))
            );

            (executeResolver(route, {} as any) as any).subscribe(() => {
                expect(mockAuthService.setPermissionsFromResponse).toHaveBeenCalledWith(null);
                done();
            });
        });

        it('should not throw on error', () => {
            const route = createRoute({});
            mockAuthService.fetchPermissions.and.returnValue(throwError(() => new Error('500')));

            expect(() => {
                (executeResolver(route, {} as any) as any).subscribe();
            }).not.toThrow();
        });
    });
});
