import { inject, Injectable, signal } from '@angular/core';
import { Issue } from '../../model/Issue';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { IssueStats } from '../../constants/api/IssueStats';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { map, Observable } from 'rxjs';
import { ParamsHandler } from '../../utils/paramsHandler';

@Injectable({
    providedIn: 'root',
})
export class IssueService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    /**
     * Creates a new issue
     * @param ids Object containing projectId and organizationId
     * @param issue Partial issue object containing required fields (e.g., title, projectId)
     * @returns Observable of the created Issue
     */
    createIssue(
        ids: { projectId: string; organizationId: string },
        issue: Partial<Issue>
    ): Observable<Issue> {
        return this.http.post<Issue>(
            `${this.url}/${ids.organizationId}/${ids.projectId}/issue`,
            issue
        );
    }

    /**
     * Fetches issues with optional query parameters
     * Automatically filters out null/undefined/empty values
     * Returns paginated response with metadata
     *
     * @param ids Object containing projectId and organizationId
     * @param queryParams Optional query parameters for filtering, sorting, and pagination
     * @returns Observable of PaginatedResponse containing an array of Issues and metadata
     */
    getIssues(
        ids: { projectId: string; organizationId: string },
        queryParams: ApiQueryParams = {}
    ): Observable<PaginatedResponse<Issue>> {
        const params = ParamsHandler.convertToHttpParams(queryParams);

        return this.http.get<PaginatedResponse<Issue>>(
            `${this.url}/${ids.organizationId}/${ids.projectId}/issue`,
            {
                params: params,
            }
        );
    }

    /**
     * Fetches an issue by its ID
     * @param data Object containing issueId, projectId, organizationId, and optional expand parameters
     * @returns Observable of the requested Issue
     */
    getIssueById(data: {
        issueId: string;
        projectId: string;
        organizationId: string;
        expand?: string;
    }): Observable<Issue> {
        const expandParams = data.expand ?? 'creator,assignee,updator';
        return this.http.get<Issue>(
            `${this.url}/${data.organizationId}/${data.projectId}/issue/${data.issueId}`,
            {
                params: {
                    expand: expandParams,
                },
            }
        );
    }

    /**
     * Fetches issues and returns only the items array (legacy support)
     * Use this if you don't need pagination metadata
     * @param data Object containing projectId, organizationId, and optional queryParams
     * @returns Observable of an array of Issues
     */
    getIssuesSimple(data: {
        projectId: string;
        organizationId: string;
        queryParams?: ApiQueryParams;
    }): Observable<Issue[]> {
        const qp = data.queryParams ?? {};
        return this.getIssues(data, qp).pipe(map((response) => response.items));
    }

    /**
     * Updates an existing issue
     * @param data Object containing issueId, projectId, organizationId, and the partial issue data to update
     * @returns Observable of the updated Issue
     */
    updateIssue(data: {
        issueId: string;
        projectId: string;
        organizationId: string;
        issue: Partial<Issue>;
    }): Observable<Issue> {
        return this.http.put<Issue>(
            `${this.url}/${data.organizationId}/${data.projectId}/issue/${data.issueId}`,
            data.issue
        );
    }

    /**
     * Deletes an issue by ID
     * @param data Object containing issueId, projectId, and organizationId
     * @returns Observable of void
     */
    deleteIssue(data: {
        issueId: string;
        projectId: string;
        organizationId: string;
    }): Observable<void> {
        return this.http.delete<void>(
            `${this.url}/${data.organizationId}/${data.projectId}/issue/${data.issueId}`
        );
    }

    /**
     * Fetches aggregated issue statistics for the current project
     * @param ids the object containing projectId and organizationId
     * @returns Observable of IssueStats containing totals, priorities, types, and activity
     */
    getStats(ids: { projectId: string; organizationId: string }): Observable<IssueStats> {
        return this.http.get<IssueStats>(
            `${this.url}/${ids.organizationId}/${ids.projectId}/issue/stats`
        );
    }
}
