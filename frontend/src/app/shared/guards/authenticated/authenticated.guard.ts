import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { successResponse } from '../../model/Response';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { UserClaims } from '../../constants/user/Claims';

export const authenticatedGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackbarService = inject(SnackbarService);

    const projectId = route.paramMap.get('projectId');
    const organizationId = route.paramMap.get('organizationId');

    const setClaims = (response: successResponse) => {
        const data = response.data;
        authService.currentUserClaims.set({
            uid: data['id'],
            email: data['email'],
            role: data['role'],
        });
        authService.currentClaimsWithPermissions.set(
            new UserClaims(data['id'], data['role'], data['email'], data['permissions'])
        );
    };

    const redirectToLogin = () => {
        authService.removeAccessToken();
        sessionStorage.setItem('redirectUrl', state.url);

        router.navigate(['/auth/login']);
        snackbarService.error('Please log in to access this page.');
        return of(false);
    };

    // No access token (e.g. expired on page load) — try refreshing via cookie first
    if (!authService.getAccessToken()) {
        return authService.refresh().pipe(
            switchMap(() =>
                authService.me(organizationId, projectId).pipe(
                    map((response) => {
                        setClaims(response as successResponse);
                        return true;
                    })
                )
            ),
            catchError(() => redirectToLogin())
        );
    }

    // Token exists — call /me directly. The interceptor handles 401 → refresh → retry.
    return authService.me(organizationId, projectId).pipe(
        map((response) => {
            setClaims(response as successResponse);
            return true;
        }),
        catchError(() => redirectToLogin())
    );
};
