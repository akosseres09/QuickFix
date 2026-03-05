import { inject, Injectable } from '@angular/core';
import { User } from '../../model/User';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = environment.apiUrl;

    getUser() {
        const id = this.authService.currentUserClaims()?.uid;

        return this.http.get<User>(`${this.apiUrl}/user/${id}`);
    }

    updateUser(userData: Partial<User>) {
        const id = this.authService.currentUserClaims()?.uid;

        const data = {
            ...userData,
            updated_at: Date.now(),
            date_of_birth: userData.dateOfBirth,
            phone_number: userData.phoneNumber,
        };

        return this.http.put<User>(`${this.apiUrl}/user/${id}`, data);
    }
}
