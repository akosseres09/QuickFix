import { inject, Injectable } from '@angular/core';
import { QueryParamsHandling, Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class UrlService {
    private readonly router = inject(Router);

    addQueryParams(
        params: { [key: string]: any },
        paramsHandling: QueryParamsHandling = 'merge'
    ): void {
        this.router.navigate([], {
            queryParams: params,
            queryParamsHandling: paramsHandling,
        });
    }

    removeQueryParams(paramKeys: string[], paramsHandling: QueryParamsHandling = 'merge'): void {
        const queryParams: { [key: string]: null } = {};

        for (const key of paramKeys) {
            queryParams[key] = null;
        }

        this.router.navigate([], {
            queryParams: queryParams,
            queryParamsHandling: paramsHandling,
        });
    }
}
