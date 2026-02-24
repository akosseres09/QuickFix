import { inject, Injectable } from '@angular/core';
import { IssueComment } from '../../model/IssueComment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

export type CommentRequestParams = {
    projectId: string;
    issueId: string;
    expand: string;
    cursor?: string;
    data?: Partial<IssueComment>;
};

export type CursorPaginatedResponse<T> = {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
};

@Injectable({
    providedIn: 'root',
})
export class IssueCommentService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    getCommentsToIssue(
        data: CommentRequestParams
    ): Observable<CursorPaginatedResponse<IssueComment>> {
        let params = new HttpParams().set('expand', data.expand);
        if (data.cursor) {
            params = params.set('cursor', data.cursor);
        }

        return this.http
            .get<PaginatedResponse<IssueComment>>(
                `${this.url}/${data.projectId}/${data.issueId}/comment`,
                {
                    params,
                    observe: 'response',
                }
            )
            .pipe(
                map((response) => ({
                    items: response.body?.items ?? [],
                    nextCursor: response.headers.get('X-Next-Cursor'),
                    hasMore: response.headers.get('X-Has-More') === 'true',
                }))
            );
    }

    createComment(data: Omit<Required<CommentRequestParams>, 'expand' | 'cursor'>) {
        return this.http.post<IssueComment>(
            `${this.url}/${data.projectId}/${data.issueId}/comment`,
            data.data
        );
    }
}
