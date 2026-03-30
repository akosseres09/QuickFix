import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Claims, UserClaims } from '../../constants/user/Claims';
import { UserPayloadToken } from '../../constants/token/UserTokenPayload';
import { SignupData } from '../../constants/user/SignupData';
import { decodeToken } from '../../utils/jwtDecoder';
import { UserRole } from '../../model/User';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private headers = new HttpHeaders({
        'Content-Type': 'application/json',
    });
    private url: string = environment.apiUrl;
    private tokenKey: string = 'access_token';

    currentClaimsWithPermissions = signal<UserClaims | null>(null);
    currentUserClaims = signal<Claims | null>(this.getUserFromToken());
    isLoggedIn = computed(() => this.currentUserClaims() !== null);
    isRefreshing = false;
    refreshTokenSubject = new BehaviorSubject<string | null>(null);
    private pendingPermissions$: Observable<any> | null = null;
    private pendingPermissionsKey: string | null = null;

    signup(data: SignupData): Observable<any> {
        const fixed = {
            ...data,
            first_name: data.firstName,
            last_name: data.lastName,
            date_of_birth: data.dateOfBirth,
            phone_number: data.phoneNumber,
        };

        return this.http.post<any>(this.url + '/auth/signup', fixed, {
            headers: this.headers,
        });
    }

    verify(token: string): Observable<any> {
        return this.http.post<any>(
            this.url + '/auth/verify',
            {
                token: token,
            },
            {
                headers: this.headers,
            }
        );
    }

    resendEmail(email: string, link: string = '/auth/resend-verification-email'): Observable<any> {
        return this.http.post<any>(
            this.url + link,
            {
                email: email,
            },
            {
                headers: this.headers,
            }
        );
    }

    resetPassword(token: string, password: string): Observable<any> {
        return this.http.post<any>(
            this.url + '/auth/reset-password',
            {
                token: token,
                password: password,
            },
            {
                headers: this.headers,
            }
        );
    }

    login(email: string, password: string): Observable<any> {
        return this.http
            .post<any>(
                this.url + '/auth/login',
                {
                    email: email,
                    password: password,
                },
                {
                    headers: this.headers,
                }
            )
            .pipe(
                tap((response: any) => {
                    if (response?.access_token) {
                        localStorage.setItem(this.tokenKey, response.access_token);
                        const user = decodeToken<Claims>(response.access_token);
                        this.currentUserClaims.set(user);
                    }
                })
            );
    }

    refresh(): Observable<any> {
        return this.http
            .get<any>(this.url + '/auth/refresh', {
                headers: this.headers,
                withCredentials: true,
            })
            .pipe(
                tap((response: any) => {
                    if (response?.access_token) {
                        localStorage.setItem('access_token', response.access_token);
                    }
                })
            );
    }

    logout(): Observable<any> {
        return this.http
            .post<any>(
                this.url + '/auth/logout',
                {},
                {
                    headers: this.headers,
                    withCredentials: true,
                }
            )
            .pipe(
                tap(() => {
                    localStorage.removeItem('access_token');
                    this.setClaimsFromResponse(null);
                })
            );
    }

    me(organizationId?: string | null, projectId?: string | null): Observable<any> {
        const params: any = {};
        if (organizationId) params.organizationId = organizationId;
        if (projectId) params.projectId = projectId;

        return this.http.get<any>(this.url + '/auth/me', {
            headers: this.headers,
            params: params,
        });
    }

    permissions(orgId?: string | null, projectId?: string | null): Observable<any> {
        const params: Record<string, string> = {};
        if (orgId) params['organizationId'] = orgId;
        if (projectId) params['projectId'] = projectId;

        return this.http.get<any>(this.url + '/auth/permissions', {
            headers: this.headers,
            withCredentials: true,
            params,
        });
    }

    /**
     * Deduplicated permission fetch — if the same request is already in-flight
     * (e.g. guard and resolver both fire on hard refresh), reuses the same Observable.
     */
    fetchPermissions(orgId?: string | null, projectId?: string | null): Observable<any> {
        const key = `${orgId ?? ''}_${projectId ?? ''}`;

        if (this.pendingPermissions$ && this.pendingPermissionsKey === key) {
            return this.pendingPermissions$;
        }

        this.pendingPermissionsKey = key;
        this.pendingPermissions$ = this.permissions(orgId, projectId).pipe(
            tap({
                complete: () => {
                    this.pendingPermissions$ = null;
                    this.pendingPermissionsKey = null;
                },
                error: () => {
                    this.pendingPermissions$ = null;
                    this.pendingPermissionsKey = null;
                },
            }),
            shareReplay(1)
        );

        return this.pendingPermissions$;
    }

    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    removeAccessToken() {
        localStorage.removeItem('access_token');
    }

    setClaimsFromResponse(data: any | null): void {
        if (!data) {
            this.currentUserClaims.set(null);
            return;
        }

        this.currentUserClaims.set({
            uid: data['id'],
            email: data['email'],
            role: data['role'],
        });
    }

    setPermissionsFromResponse(data: any | null): void {
        if (!data) {
            this.currentClaimsWithPermissions.set(null);
            return;
        }

        this.currentClaimsWithPermissions.set(
            new UserClaims(data['id'], data['role'], data['email'], data['permissions'])
        );
    }

    private getUserFromToken(): Claims | null {
        const decodedToken = this.getDecodedToken();
        if (!decodedToken) return null;

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role,
        };
    }

    private getDecodedToken(): UserPayloadToken | null {
        const token = localStorage.getItem(this.tokenKey);
        if (!token) return null;

        const decodedToken = decodeToken<UserPayloadToken>(token);

        if (!decodedToken || decodedToken.exp * 1000 < Date.now()) {
            localStorage.removeItem(this.tokenKey);
            return null;
        }

        return decodedToken;
    }
}
