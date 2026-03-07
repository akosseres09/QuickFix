import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { Worktime } from '../../model/Worktime';
import { Observable } from 'rxjs';

export type WorktimeRequestIds = {
    organizationId: string;
    projectId: string;
};

@Injectable({
    providedIn: 'root',
})
export class WorktimeService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    private baseUrl(organizationId: string): string {
        return `${this.url}/${organizationId}/worktime`;
    }

    getWorktime(
        organizationId: string,
        queryParams?: ApiQueryParams
    ): Observable<PaginatedResponse<Worktime>> {
        const params = queryParams ? ParamsHandler.convertToHttpParams(queryParams) : {};
        return this.http.get<PaginatedResponse<Worktime>>(this.baseUrl(organizationId), { params });
    }

    createWorktime(
        organizationId: string,
        data: { issue_id: string; minutes_spent: number; logged_at: string; description?: string }
    ): Observable<Worktime> {
        return this.http.post<Worktime>(this.baseUrl(organizationId), data);
    }

    updateWorktime(
        organizationId: string,
        worktimeId: string,
        data: Partial<{ minutes_spent: number; logged_at: string; description: string }>
    ): Observable<Worktime> {
        return this.http.put<Worktime>(`${this.baseUrl(organizationId)}/${worktimeId}`, data);
    }

    deleteWorktime(organizationId: string, worktimeId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl(organizationId)}/${worktimeId}`);
    }
}
