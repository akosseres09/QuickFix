import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class UrlService {
    private router = inject(Router);

    addQueryParams(params: { [key: string]: any }): void {
        this.router.navigate([], {
            queryParams: params,
            queryParamsHandling: 'merge',
        });
    }

    removeQueryParams(paramKeys: string[]): void {
        const queryParams = { ...this.router.routerState.snapshot.root.queryParams };
        for (const key of paramKeys) {
            delete queryParams[key];
        }
        this.router.navigate([], {
            queryParams: queryParams,
            queryParamsHandling: 'preserve',
        });
    }
}
