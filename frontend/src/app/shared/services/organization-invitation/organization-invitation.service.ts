import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { OrganizationInvitation } from '../../model/OrganizationInvitation';
import { Observable } from 'rxjs';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler/paramsHandler';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

@Injectable({
    providedIn: 'root',
})
export class OrganizationInvitationService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;
    private readonly invitationTokenKey = 'invitationToken';

    sendInvitation(
        invitation: Partial<OrganizationInvitation>
    ): Observable<OrganizationInvitation> {
        return this.http.post<OrganizationInvitation>(`${this.url}/invitation`, invitation);
    }

    getInvitations(payload: ApiQueryParams) {
        const qp = ParamsHandler.convertToHttpParams(payload);

        return this.http.get<PaginatedResponse<OrganizationInvitation>>(`${this.url}/invitation`, {
            params: qp,
        });
    }

    getInvitationById(identifier: string): Observable<OrganizationInvitation> {
        return this.http.get<OrganizationInvitation>(`${this.url}/invitation/${identifier}`, {
            params: {
                expand: 'organization, inviter',
            },
        });
    }

    updateInvitation(
        identifier: string,
        invitation: Partial<OrganizationInvitation>
    ): Observable<OrganizationInvitation> {
        return this.http.put<OrganizationInvitation>(
            `${this.url}/invitation/${identifier}`,
            invitation,
            {
                params: {
                    expand: 'organization, inviter',
                },
            }
        );
    }

    setInvitationToken(token: string) {
        sessionStorage.setItem(this.invitationTokenKey, token);
    }

    deleteInvitationToken() {
        sessionStorage.removeItem(this.invitationTokenKey);
    }

    getInvitationToken(): string | null {
        return sessionStorage.getItem(this.invitationTokenKey);
    }
}
