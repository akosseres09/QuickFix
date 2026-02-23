import { inject, Injectable } from '@angular/core';
import { IssueComment } from '../../model/IssueComment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { expand, Observable } from 'rxjs';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

export type CommentRequestParams = {
    projectId: string;
    issueId: string;
    expand: string;
    data?: Partial<IssueComment>;
};

@Injectable({
    providedIn: 'root',
})
export class IssueCommentService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    getCommentsToIssue(data: CommentRequestParams): Observable<PaginatedResponse<IssueComment>> {
        return this.http.get<PaginatedResponse<IssueComment>>(
            `${this.url}/${data.projectId}/${data.issueId}/comment`,
            {
                params: {
                    expand: data.expand,
                },
            }
        );
    }

    createComment(data: Omit<Required<CommentRequestParams>, 'expand'>) {
        return this.http.post<IssueComment>(
            `${this.url}/${data.projectId}/${data.issueId}/comment`,
            data.data
        );
    }
}
