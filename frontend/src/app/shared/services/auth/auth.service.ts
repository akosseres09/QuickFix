import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { errorResponse, successResponse } from '../../model/Response';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private http: HttpClient) {}

    signup(data: any): Observable<errorResponse | successResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        return this.http.post<errorResponse | successResponse>(
            'http://api.ticketing.test/auth/signup',
            data,
            {
                headers: headers,
            }
        );
    }

    verify(token: string) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        return this.http.post<errorResponse | successResponse>(
            'http://api.ticketing.test/auth/verify',
            {
                token: token,
            },
            {
                headers: headers,
            }
        );
    }
}
