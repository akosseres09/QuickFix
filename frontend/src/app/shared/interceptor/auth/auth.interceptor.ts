import {
    HttpErrorResponse,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';
/**
 * Interceptor that adds the access token to outgoing requests and handles 401 responses by attempting a token refresh.
 * @param req the outgoing HTTP request
 * @param next the next interceptor in the chain
 * @return an Observable of the HTTP event stream, with the access token added to requests and 401 errors handled
 */
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
            if (err instanceof HttpErrorResponse && err.status === 401 && token) {
                return handle401Error(authReq, next, authService);
            }
            return throwError(() => err);
        })
    );
};

/**
 * Adds the Authorization header with the Bearer token to the request.
 * @param req the HTTP request to modify
 * @param token the access token to add to the request
 * @returns the modified HTTP request with the Authorization header
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
 * Handles 401 Unauthorized errors by attempting to refresh the access token.
 * If a refresh is already in progress, it waits for it to complete.
 * @param req the original HTTP request that resulted in a 401 error
 * @param next the next interceptor function to call with the modified request
 * @param authService the AuthService instance to use for refreshing the token and managing authentication state
 * @returns an Observable of the HTTP event stream with the refreshed token applied or an error propagated if the refresh fails
 */
const handle401Error = (req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
    if (!authService.isRefreshing) {
        authService.isRefreshing = true;
        authService.refreshTokenSubject.next(null);

        return authService.refresh().pipe(
            switchMap((response: any) => {
                authService.isRefreshing = false;

                if (response.success && response.data['access_token']) {
                    const newToken = response.data['access_token'];
                    authService.refreshTokenSubject.next(newToken);
                    return next(addToken(req, newToken));
                }

                // No access token returned — let the error propagate to the caller
                authService.removeAccessToken();
                return throwError(() => new Error('Refresh failed'));
            }),
            catchError((err) => {
                authService.isRefreshing = false;
                authService.removeAccessToken();
                return throwError(() => err);
            })
        );
    }

    // Another request already triggered a refresh — wait for it to complete
    return authService.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next(addToken(req, token!)))
    );
};
