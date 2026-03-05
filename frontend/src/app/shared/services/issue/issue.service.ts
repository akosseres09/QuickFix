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
     * @param issue Partial issue object containing required fields (e.g., title, projectId)
     * @returns Observable of the created Issue
     */
    createIssue(projectId: string, issue: Partial<Issue>): Observable<Issue> {
        return this.http.post<Issue>(`${this.url}/${projectId}/issue`, issue);
    }

    /**
     * Fetches issues with optional query parameters
     * Automatically filters out null/undefined/empty values
     * Returns paginated response with metadata
     */
    getIssues(
        projectId: string,
        queryParams: ApiQueryParams = {}
    ): Observable<PaginatedResponse<Issue>> {
        const params = ParamsHandler.convertToHttpParams(queryParams);

        return this.http.get<PaginatedResponse<Issue>>(`${this.url}/${projectId}/issue`, {
            params: params,
        });
    }

    getIssueById(data: { issueId: string; projectId: string; expand?: string }): Observable<Issue> {
        const expandParams = data.expand ?? 'creator,assignee,updator';
        return this.http.get<Issue>(`${this.url}/${data.projectId}/issue/${data.issueId}`, {
            params: {
                expand: expandParams,
            },
        });
    }

    /**
     * Fetches issues and returns only the items array (legacy support)
     * Use this if you don't need pagination metadata
     * @param queryParams Optional query parameters for filtering/sorting/pagination
     * @returns Observable of an array of Issues
     */
    getIssuesSimple(data: {
        projectId: string;
        queryParams?: ApiQueryParams;
    }): Observable<Issue[]> {
        const qp = data.queryParams ?? {};
        return this.getIssues(data.projectId, qp).pipe(map((response) => response.items));
    }

    /**
     * Updates an existing issue
     * @param id ID of the issue to update
     * @param issue Partial issue object containing fields to update (e.g., title, status)
     * @returns Observable of the updated Issue
     */
    updateIssue(data: {
        issueId: string;
        projectid: string;
        issue: Partial<Issue>;
    }): Observable<Issue> {
        return this.http.put<Issue>(
            `${this.url}/${data.projectid}/issue/${data.issueId}`,
            data.issue
        );
    }

    /**
     * Deletes an issue by ID
     * @param id ID of the issue to delete
     * @returns Observable of void
     */
    deleteIssue(data: { issueId: string; projectId: string }): Observable<void> {
        return this.http.delete<void>(`${this.url}/${data.projectId}/issue/${data.issueId}`);
    }

    /**
     * Fetches aggregated issue statistics for the current project
     * @param projectId the id of the project
     * @returns Observable of IssueStats containing totals, priorities, types, and activity
     */
    getStats(projectId: string): Observable<IssueStats> {
        return this.http.get<IssueStats>(`${this.url}/${projectId}/issue/stats`);
    }
}
