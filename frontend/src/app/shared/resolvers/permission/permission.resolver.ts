import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { map } from 'rxjs/internal/operators/map';
import { successResponse } from '../../model/Response';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';

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

    return authService.permissions(orgId, projectId).pipe(
        map((response) => {
            const data = (response as successResponse).data;
            authService.setPermissionsFromResponse(data);
        }),
        catchError(() => of(void 0))
    );
};
