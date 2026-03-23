import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { inject } from '@angular/core';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { catchError, map, of } from 'rxjs';
import { successResponse } from '../../model/Response';

export const permissionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const snackbarService = inject(SnackbarService);
    const router = inject(Router);

    const permission = route.data['permission'];
    if (!permission) {
        // No specific permission required, allow access
        return true;
    }

    // Crawl up to include params owned by parent route segments.
    let current: typeof route | null = route;
    let orgId: string | null = null;
    let projectId: string | null = null;

    while (current) {
        if (!orgId) orgId = current.paramMap.get('organizationId');
        if (!projectId) projectId = current.paramMap.get('projectId');
        current = current.parent;
    }

    const hasBasePermission = () => {
        const userClaims = authService.currentClaimsWithPermissions();
        if (!userClaims) return false;

        return userClaims.canDo(permission, {
            orgId: orgId || undefined,
            projectId: projectId || undefined,
        });
    };

    if (hasBasePermission()) {
        return true;
    }

    // On hard refresh, guards run before resolvers. Fetch permissions here, then re-check.
    return authService.permissions(orgId, projectId).pipe(
        map((response) => {
            const data = (response as successResponse).data;
            authService.setPermissionsFromResponse(data);

            if (hasBasePermission()) {
                return true;
            }

            snackbarService.error("You don't have permission to access this page.");
            return router.createUrlTree(['/']);
        }),
        catchError(() => {
            snackbarService.error("You don't have permission to access this page.");
            return of(router.createUrlTree(['/']));
        })
    );
};
