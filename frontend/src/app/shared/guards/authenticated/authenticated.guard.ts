import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { successResponse } from '../../model/Response';

export const authenticatedGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const setClaims = (response: successResponse) => {
        const data = response.data;
        authService.currentUserClaims.set({
            uid: data['id'],
            email: data['email'],
            role: data['is_admin'] ? 'admin' : 'user',
        });
    };

    const redirectToLogin = () => {
        authService.removeAccessToken();
        router.navigate(['/auth/login']);
        return of(false);
    };

    // No access token (e.g. expired on page load) — try refreshing via cookie first
    if (!authService.getAccessToken()) {
        return authService.refresh().pipe(
            switchMap(() =>
                authService.me().pipe(
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
    return authService.me().pipe(
        map((response) => {
            setClaims(response as successResponse);
            return true;
        }),
        catchError(() => redirectToLogin())
    );
};
