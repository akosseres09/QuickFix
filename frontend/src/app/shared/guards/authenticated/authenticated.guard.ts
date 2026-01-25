import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, filter, map, of, switchMap, take } from 'rxjs';
import { successResponse } from '../../model/Response';

// TODO: fix refreshing token logic
export const authenticatedGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.me().pipe(
        take(1),
        map((response) => {
            if (response.success) {
                const data = (response as successResponse).data;
                authService.currentUserClaims.set({
                    uid: data['id'],
                    email: data['email'],
                    role: data['is_admin'] ? 'admin' : 'user',
                });
                return true;
            }
            router.navigate(['/auth/login']);
            return false;
        }),
        catchError((error) => {
            // If a token refresh is already in progress, wait for it
            if (!authService.isRefreshing) {
                return authService.refreshTokenSubject.pipe(
                    filter((token) => token !== null),
                    switchMap(() => {
                        // Retry /auth/me after refresh completes
                        return authService.me().pipe(
                            map((response) => {
                                if (response.success) {
                                    const data = (response as successResponse).data;
                                    authService.currentUserClaims.set({
                                        uid: data['id'],
                                        email: data['email'],
                                        role: data['is_admin'] ? 'admin' : 'user',
                                    });
                                    return true;
                                }
                                router.navigate(['/auth/login']);
                                return false;
                            }),
                            catchError(() => {
                                router.navigate(['/auth/login']);
                                return of(false);
                            })
                        );
                    })
                );
            }

            // No refresh in progress, redirect to login
            router.navigate(['/auth/login']);
            return of(false);
        })
    );
};
