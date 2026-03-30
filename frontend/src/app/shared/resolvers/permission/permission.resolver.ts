import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/internal/operators/catchError';
import { EMPTY } from 'rxjs';

export const permissionResolver: ResolveFn<void> = (route) => {
    const authService = inject(AuthService);

    // Crawl up to find params from parent segments
    let current: ActivatedRouteSnapshot | null = route;
    let orgId: string | null = null;
    let projectId: string | null = null;

    while (current) {
        if (!orgId) orgId = current.paramMap.get('organizationId');
        if (!projectId) projectId = current.paramMap.get('projectId');
        current = current.parent;
    }

    return authService.fetchPermissions(orgId, projectId).pipe(
        map((response: any) => {
            authService.setPermissionsFromResponse(response);
        }),
        catchError(() => {
            // Permission fetch failed — clear stale permissions so guards deny correctly
            authService.setPermissionsFromResponse(null);
            return EMPTY;
        })
    );
};
