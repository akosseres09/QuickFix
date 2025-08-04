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

    verify(token: string) {
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

    resendEmail(email: string): Observable<errorResponse | successResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        return this.http.post<errorResponse | successResponse>(
            this.url + '/auth/resend-verification-email',
            {
                email: email,
            },
            {
                headers: headers,
            }
        );
    }
}
