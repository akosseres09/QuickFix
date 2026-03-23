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

export const authenticatedGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackbarService = inject(SnackbarService);

    const redirectToLogin = () => {
        authService.removeAccessToken();
        authService.setClaimsFromResponse(null);
        sessionStorage.setItem('redirectUrl', state.url);
        router.navigate(['/auth/login']);
        snackbarService.error('Please log in to access this page.');
        return of(false);
    };

    const setUserData = (response: any) => {
        authService.setClaimsFromResponse((response as successResponse).data);
        return true;
    };

    if (authService.currentClaimsWithPermissions()) {
        return true;
    }

    if (!authService.getAccessToken()) {
        return authService.refresh().pipe(
            switchMap(() =>
                authService.me().pipe(
                    map((response) => {
                        return setUserData(response);
                    })
                )
            ),
            catchError(() => redirectToLogin())
        );
    }

    return authService.me().pipe(
        map((response) => {
            return setUserData(response);
        }),
        catchError(() => redirectToLogin())
    );
};
