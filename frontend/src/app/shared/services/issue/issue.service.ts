import { inject, Injectable } from '@angular/core';
import { Issue } from '../../model/Issue';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class IssueService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;
    private projectId = 'QF_IT';

    /**
     * Creates a new issue
     * @param issue Partial issue object containing required fields (e.g., title, projectId)
     * @returns Observable of the created Issue
     */
    createIssue(issue: Partial<Issue>): Observable<Issue> {
        return this.http.post<Issue>(`${this.url}/${this.projectId}/issue`, issue);
    }

    /**
     * Fetches issues with optional query parameters
     * Automatically filters out null/undefined/empty values
     * Returns paginated response with metadata
     */
    getIssues(queryParams: ApiQueryParams = {}): Observable<PaginatedResponse<Issue>> {
        let params = new HttpParams();

        Object.entries(queryParams).forEach(([key, value]) => {
            // Only add non-null, non-undefined, non-empty values
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value.toString());
            }
        });

        return this.http.get<PaginatedResponse<Issue>>(`${this.url}/${this.projectId}/issue`, {
            params: params,
        });
    }

    /**
     * Fetches issues and returns only the items array (legacy support)
     * Use this if you don't need pagination metadata
     * @param queryParams Optional query parameters for filtering/sorting/pagination
     * @returns Observable of an array of Issues
     */
    getIssuesSimple(queryParams: ApiQueryParams = {}): Observable<Issue[]> {
        return this.getIssues(queryParams).pipe(map((response) => response.items));
    }

    /**
     * Updates an existing issue
     * @param id ID of the issue to update
     * @param issue Partial issue object containing fields to update (e.g., title, status)
     * @returns Observable of the updated Issue
     */
    updateIssue(id: string, issue: Partial<Issue>): Observable<Issue> {
        return this.http.put<Issue>(`${this.url}/${this.projectId}/issue/${id}`, issue);
    }

    /**
     * Deletes an issue by ID
     * @param id ID of the issue to delete
     * @returns Observable of void
     */
    deleteIssue(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${this.projectId}/issue/${id}`);
    }

    setProjectId(projectId: string) {
        this.projectId = projectId;
    }
}
