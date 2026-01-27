import {
    HttpErrorResponse,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';

// TODO: fix token refresh logic
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    if (req.url.includes('/auth/refresh')) {
        return next(req);
    }

    let authReq = req;
    if (token) {
        authReq = addToken(req, token);
    }

    return next(authReq).pipe(
        catchError((err) => {
            if (err instanceof HttpErrorResponse && err.status === 401) {
                return handle401Error(authReq, next, authService);
            }
            return throwError(() => err);
        })
    );
};

const addToken = (req: HttpRequest<any>, token: string) => {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
    });
};

const handle401Error = (req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
    if (!authService.isRefreshing) {
        authService.isRefreshing = true;
        authService.refreshTokenSubject.next(null);

        return authService.refresh().pipe(
            switchMap((response: any) => {
                authService.isRefreshing = false;

                if (response.success) {
                    const newToken = response.data['access_token'];
                    localStorage.setItem('access_token', newToken);
                    authService.refreshTokenSubject.next(newToken);

                    return next(addToken(req, newToken));
                }

                authService.logout();
                return throwError(() => new Error('Refresh failed'));
            }),
            catchError((err) => {
                authService.isRefreshing = false;
                authService.logout();
                return throwError(() => err);
            })
        );
    } else {
        return authService.refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => {
                return next(addToken(req, token!));
            })
        );
    }
};
