import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { errorResponse, successResponse } from '../../model/Response';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

interface Claims {
    uid: number;
    role: string;
    email: string;
}

interface DecodedToken {
    // issuer
    iss: string;
    // audience
    aud: string;
    // jwt id
    jti: string;
    // issued at
    iat: number;
    // not before
    nbf: number;
    // expiration
    exp: number;
    // user id (custom claim)
    uid: number;
    // role (custom claim)
    role: string;
    // email (custom claim)
    email: string;
}

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

    signup(data: any): Observable<errorResponse | successResponse> {
        return this.http.post<errorResponse | successResponse>(this.url + '/auth/signup', data, {
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

    logout(): Observable<errorResponse | successResponse> {
        return this.http
            .post<errorResponse | successResponse>(
                this.url + '/auth/logout',
                {},
                {
                    headers: this.headers,
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

    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    private getUserFromToken(): Claims | null {
        const decodedToken = this.getDecodedToken();
        if (!decodedToken) return null;

        console.log(decodedToken);

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
            this.logout();
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
