import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { errorResponse, successResponse } from '../../model/Response';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private http: HttpClient) {}

    url: string = environment.apiUrl;

    signup(data: any): Observable<errorResponse | successResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        return this.http.post<errorResponse | successResponse>(this.url + '/auth/signup', data, {
            headers: headers,
        });
    }

    verify(token: string): Observable<errorResponse | successResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        return this.http.post<errorResponse | successResponse>(
            this.url + '/auth/verify',
            {
                token: token,
            },
            {
                headers: headers,
            }
        );
    }

    resendEmail(
        email: string,
        link: string = '/auth/resend-verification-email'
    ): Observable<errorResponse | successResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        const fullUrl = this.url + link;

        return this.http.post<errorResponse | successResponse>(
            fullUrl,
            {
                email: email,
            },
            {
                headers: headers,
            }
        );
    }

    resetPassword(token: string, password: string): Observable<errorResponse | successResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        return this.http.post<errorResponse | successResponse>(
            this.url + '/auth/reset-password',
            {
                token: token,
                password: password,
            },
            {
                headers: headers,
            }
        );
    }
}
