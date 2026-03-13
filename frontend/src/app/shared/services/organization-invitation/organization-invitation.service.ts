import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { OrganizationInvitation } from '../../model/OrganizationInvitation';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class OrganizationInvitationService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    sendInvitation(
        organizationId: string,
        invitation: Partial<OrganizationInvitation>
    ): Observable<OrganizationInvitation> {
        return this.http.post<OrganizationInvitation>(
            `${this.url}/${organizationId}/invitation`,
            invitation
        );
    }

    getInvitationByToken(organizationId: string, token: string) {
        return this.http.get<OrganizationInvitation>(`${this.url}/${organizationId}/invitations`, {
            params: {
                token,
            },
        });
    }
}
