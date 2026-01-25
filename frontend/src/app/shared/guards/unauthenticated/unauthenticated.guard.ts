import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { inject } from '@angular/core';
import { catchError, map, of, take } from 'rxjs';

export const unauthenticatedGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.me().pipe(
        take(1),
        map((response) => {
            if (response.success) {
                router.navigate(['/projects']);
                return false;
            }
            return true;
        }),
        catchError(() => {
            return of(true);
        })
    );
};
