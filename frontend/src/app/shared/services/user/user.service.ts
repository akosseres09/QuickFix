import { inject, Injectable } from '@angular/core';
import { User } from '../../model/User';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';

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

    getUserByUsername(username: string, params: ApiQueryParams = {}) {
        const qp = ParamsHandler.convertToHttpParams(params);
        return this.http.get<User>(`${this.apiUrl}/user/${username}`, {
            params: qp,
        });
    }

    getUserByEmail(email: string, params: ApiQueryParams = {}) {
        const qp = ParamsHandler.convertToHttpParams(params);
        return this.http.get<User>(`${this.apiUrl}/user/${email}`, {
            params: qp,
        });
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

    uploadProfilePicture(file: File) {
        const id = this.authService.currentUserClaims()?.uid;
        const formData = new FormData();
        formData.append('profile_picture', file);

        return this.http.post<{ success: boolean; data: { profilePictureUrl: string } }>(
            `${this.apiUrl}/user/${id}/upload-profile-picture`,
            formData
        );
    }
}
