import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { inject } from '@angular/core';
import { SnackbarService } from '../../services/snackbar/snackbar.service';

export const permissionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const snackbarService = inject(SnackbarService);
    const router = inject(Router);

    const permission = route.data['permission'];
    if (!permission) {
        // No specific permission required, allow access
        return true;
    }

    const orgId = route.paramMap.get('organizationId');

    const hasBasePermission = () => {
        const userClaims = authService.currentClaimsWithPermissions();
        if (!userClaims) return false;

        return userClaims.canDo(permission, { orgId: orgId || undefined });
    };

    if (!hasBasePermission()) {
        snackbarService.error("You don't have permission to access this page.");
        router.navigate(['/organizations']);
        return false;
    }
    return true;
};
