import {
    HttpErrorResponse,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';
import { successResponse } from '../../model/Response';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    if (req.url.includes('auth/refresh-token')) {
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

/**
 * Helper function to add the access token to the request
 * @param req the request
 * @param token the access token
 * @returns
 */
const addToken = (req: HttpRequest<any>, token: string) => {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
    });
};

/**
 * Helper function to handle 401 Unauthorized errors.
 * If token refresh has already been requested then subscribes to authService.refreshTokenSubject, adds the token to the request and handles the next request.
 * If token refresh has not already been requested then start it by sending a request to /auth/refresh-token. If access token is returned then handles the next request
 * @param req The request
 * @param next the function that handles the next request
 * @param authService injected auth service to handle queing
 * @returns
 */
const handle401Error = (req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
    if (!authService.isRefreshing) {
        authService.isRefreshing = true;
        authService.refreshTokenSubject.next(null);

        return authService.refresh().pipe(
            switchMap((response) => {
                authService.isRefreshing = false;
                if (response.success) {
                    const resp = response as successResponse;
                    const token = resp.data['access_token'];
                    authService.refreshTokenSubject.next(token);
                    return next(addToken(req, token));
                }

                return next(req);
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
                return next(addToken(req, token));
            })
        );
    }
};
