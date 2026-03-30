import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IssueCommentService, CommentRequestParams } from './issue-comment.service';
import { IssueComment } from '../../model/IssueComment';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG = 'org-1';
const PROJECT = 'proj-1';
const ISSUE = 'issue-1';
const COMMENT_ID = 'comment-1';

function fakeComment(overrides: Partial<IssueComment> = {}): IssueComment {
    return {
        id: COMMENT_ID,
        issueId: ISSUE,
        content: 'A test comment',
        createdAt: 1700000000,
        updatedAt: 1700000000,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        ...overrides,
    };
}

function baseParams(): Omit<Required<CommentRequestParams>, 'cursor' | 'commentId'> {
    return {
        organizationId: ORG,
        projectId: PROJECT,
        issueId: ISSUE,
        expand: 'creator',
        data: { content: 'Hello' },
    };
}

describe('IssueCommentService', () => {
    let service: IssueCommentService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(IssueCommentService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getCommentsToIssue ====================

    describe('getCommentsToIssue', () => {
        const url = `/${ORG}/${PROJECT}/${ISSUE}/comment`;

        it('should GET comments with expand param', () => {
            const data: CommentRequestParams = {
                organizationId: ORG,
                projectId: PROJECT,
                issueId: ISSUE,
                expand: 'creator',
            };

            service.getCommentsToIssue(data).subscribe((result) => {
                expect(result.items.length).toBe(1);
                expect(result.hasMore).toBeTrue();
                expect(result.nextCursor).toBe('cursor-abc');
            });

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('expand')).toBe('creator');
            expect(req.request.params.has('cursor')).toBeFalse();

            req.flush(
                {
                    items: [fakeComment()],
                    _meta: { totalCount: 1, pageCount: 1, currentPage: 1, perPage: 20 },
                    _links: { self: { href: url } },
                } as PaginatedResponse<IssueComment>,
                {
                    headers: {
                        'X-Next-Cursor': 'cursor-abc',
                        'X-Has-More': 'true',
                    },
                }
            );
        });

        it('should include cursor param when provided', () => {
            const data: CommentRequestParams = {
                organizationId: ORG,
                projectId: PROJECT,
                issueId: ISSUE,
                expand: 'creator',
                cursor: 'cursor-xyz',
            };

            service.getCommentsToIssue(data).subscribe();

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.params.get('cursor')).toBe('cursor-xyz');

            req.flush(
                {
                    items: [],
                    _meta: { totalCount: 0, pageCount: 0, currentPage: 1, perPage: 20 },
                    _links: { self: { href: url } },
                },
                { headers: { 'X-Has-More': 'false' } }
            );
        });

        it('should return hasMore false and null cursor when headers are absent', () => {
            const data: CommentRequestParams = {
                organizationId: ORG,
                projectId: PROJECT,
                issueId: ISSUE,
                expand: 'creator',
            };

            service.getCommentsToIssue(data).subscribe((result) => {
                expect(result.items).toEqual([]);
                expect(result.hasMore).toBeFalse();
                expect(result.nextCursor).toBeNull();
            });

            httpTesting
                .expectOne((r) => r.url === url)
                .flush({
                    items: [],
                    _meta: { totalCount: 0, pageCount: 0, currentPage: 1, perPage: 20 },
                    _links: { self: { href: url } },
                });
        });
    });

    // ==================== createComment ====================

    describe('createComment', () => {
        const url = `/${ORG}/${PROJECT}/${ISSUE}/comment`;

        it('should POST and return the created comment', () => {
            const expected = fakeComment({ content: 'Hello' });

            service.createComment(baseParams()).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ content: 'Hello' });
            expect(req.request.params.get('expand')).toBe('creator');
            req.flush(expected);
        });

        it('should emit on commentCreated$ subject', () => {
            const emitted: IssueComment[] = [];
            service.commentCreated$.subscribe((c) => emitted.push(c));

            service.createComment(baseParams()).subscribe();

            httpTesting.expectOne((r) => r.url === url).flush(fakeComment());
            expect(emitted.length).toBe(1);
        });
    });

    // ==================== editComment ====================

    describe('editComment', () => {
        const url = `/${ORG}/${PROJECT}/${ISSUE}/comment/${COMMENT_ID}`;

        it('should PUT and return the updated comment', () => {
            const params: Omit<Required<CommentRequestParams>, 'cursor'> = {
                ...baseParams(),
                commentId: COMMENT_ID,
                data: { content: 'Edited' },
            };
            const expected = fakeComment({ content: 'Edited' });

            service.editComment(params).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual({ content: 'Edited' });
            req.flush(expected);
        });

        it('should emit on commentUpdated$ subject', () => {
            let emitCount = 0;
            service.commentUpdated$.subscribe(() => emitCount++);

            const params: Omit<Required<CommentRequestParams>, 'cursor'> = {
                ...baseParams(),
                commentId: COMMENT_ID,
                data: { content: 'Edited' },
            };

            service.editComment(params).subscribe();
            httpTesting.expectOne((r) => r.url === url).flush(fakeComment());
            expect(emitCount).toBe(1);
        });
    });

    // ==================== deleteComment ====================

    describe('deleteComment', () => {
        it('should DELETE at the correct URL', () => {
            service
                .deleteComment({
                    organizationId: ORG,
                    projectId: PROJECT,
                    issueId: ISSUE,
                    commentId: COMMENT_ID,
                })
                .subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/${ISSUE}/comment/${COMMENT_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service
                .getCommentsToIssue({
                    organizationId: ORG,
                    projectId: PROJECT,
                    issueId: ISSUE,
                    expand: 'creator',
                })
                .subscribe({
                    next: () => fail('expected error'),
                    error: (err) => expect(err.status).toBe(403),
                });

            httpTesting
                .expectOne((r) => r.url === `/${ORG}/${PROJECT}/${ISSUE}/comment`)
                .flush('Forbidden', { status: 403, statusText: 'Forbidden' });
        });
    });
});
