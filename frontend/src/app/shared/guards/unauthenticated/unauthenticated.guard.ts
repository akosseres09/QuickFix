import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { inject } from '@angular/core';
import { catchError, map, of, take } from 'rxjs';

export const unauthenticatedGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // No access token means the user is unauthenticated — let them through.
    // This avoids calling /me which would trigger the interceptor's refresh
    // flow (via cookie), potentially bouncing the user back to a protected route.
    if (!authService.getAccessToken()) {
        return true;
    }

    // Access token exists — verify it's still valid
    return authService.me().pipe(
        take(1),
        map((response) => {
            if (response.success) {
                router.navigate(['/organizations']);
                return false;
            }
            return true;
        }),
        catchError(() => {
            authService.removeAccessToken();
            return of(true);
        })
    );
};
