import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { errorResponse, successResponse } from '../../model/Response';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Claims } from '../../constants/user/Claims';
import { DecodedToken } from '../../constants/user/DecodedToken';
import { SignupData } from '../../constants/user/SignupData';

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

    currentUserClaims = signal<Claims | null>(this.getUserFromToken());
    isLoggedIn = computed(() => this.currentUserClaims() !== null);
    isRefreshing = false;
    refreshTokenSubject = new BehaviorSubject<string | null>(null);

    signup(data: SignupData): Observable<errorResponse | successResponse> {
        const fixed = {
            ...data,
            first_name: data.firstName,
            last_name: data.lastName,
            date_of_birth: data.dateOfBirth,
            phone_number: data.phoneNumber,
        };

        return this.http.post<errorResponse | successResponse>(this.url + '/auth/signup', fixed, {
            headers: this.headers,
        });
    }

    verify(token: string): Observable<errorResponse | successResponse> {
        return this.http.post<errorResponse | successResponse>(
            this.url + '/auth/verify',
            {
                token: token,
            },
            {
                headers: this.headers,
            }
        );
    }

    resendEmail(
        email: string,
        link: string = '/auth/resend-verification-email'
    ): Observable<errorResponse | successResponse> {
        return this.http.post<errorResponse | successResponse>(
            this.url + link,
            {
                email: email,
            },
            {
                headers: this.headers,
            }
        );
    }

    resetPassword(token: string, password: string): Observable<errorResponse | successResponse> {
        return this.http.post<errorResponse | successResponse>(
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

    login(email: string, password: string): Observable<errorResponse | successResponse> {
        return this.http
            .post<errorResponse | successResponse>(
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
                tap((response) => {
                    if (response.success) {
                        const data = (response as successResponse).data;
                        localStorage.setItem(this.tokenKey, data['access_token']);
                        const user = this.decodeToken(data['access_token']);
                        this.currentUserClaims.set(user);
                    }
                })
            );
    }

    refresh(): Observable<errorResponse | successResponse> {
        return this.http
            .get<errorResponse | successResponse>(this.url + '/auth/refresh', {
                headers: this.headers,
                withCredentials: true,
            })
            .pipe(
                tap((response) => {
                    if (response.success) {
                        const resp = response as successResponse;
                        localStorage.setItem('access_token', resp.data['access_token']);
                    }
                })
            );
    }

    logout(): Observable<errorResponse | successResponse> {
        return this.http
            .post<errorResponse | successResponse>(
                this.url + '/auth/logout',
                {},
                {
                    headers: this.headers,
                    withCredentials: true,
                }
            )
            .pipe(
                tap((response) => {
                    if (response.success) {
                        localStorage.removeItem('access_token');
                        this.currentUserClaims.set(null);
                    }
                })
            );
    }

    me(): Observable<errorResponse | successResponse> {
        return this.http.get<errorResponse | successResponse>(this.url + '/auth/me', {
            headers: this.headers,
            withCredentials: true,
        });
    }

    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    removeAccessToken() {
        localStorage.removeItem('access_token');
        this.currentUserClaims.set(null);
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

    private getDecodedToken(): DecodedToken | null {
        const token = localStorage.getItem(this.tokenKey);
        if (!token) return null;

        const decodedToken = this.decodeToken(token);

        if (!decodedToken || decodedToken.exp * 1000 < Date.now()) {
            localStorage.removeItem(this.tokenKey);
            return null;
        }

        return decodedToken;
    }

    private decodeToken(token: string): DecodedToken | null {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded;
        } catch (e) {
            console.error('Error decoding token', e);
            return null;
        }
    }
}
