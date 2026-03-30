import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IssueService } from './issue.service';
import { Issue, IssuePriority, IssueType } from '../../model/Issue';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { IssueStats } from '../../constants/api/IssueStats';

// ---------- helpers ----------

const ORG = 'org-1';
const PROJECT = 'proj-1';
const ISSUE_ID = 'issue-42';
const ids = { organizationId: ORG, projectId: PROJECT };

/** Minimal Issue stub reusable across tests */
function fakeIssue(overrides: Partial<Issue> = {}): Issue {
    return {
        id: ISSUE_ID,
        projectId: PROJECT,
        issueKey: 'PROJ-1',
        title: 'Fix login bug',
        description: 'Users cannot log in',
        type: IssueType.BUG,
        statusLabel: 'open',
        priority: IssuePriority.HIGH,
        createdBy: 'user-1',
        updatedBy: null,
        assignedTo: null,
        createdAt: 1700000000,
        updatedAt: null,
        closedAt: null,
        dueDate: null,
        isArchived: false,
        isDraft: false,
        ...overrides,
    };
}

function fakePaginated<T>(items: T[]): PaginatedResponse<T> {
    return {
        items,
        _meta: { totalCount: items.length, pageCount: 1, currentPage: 1, perPage: 20 },
        _links: { self: { href: '/issues' } },
    };
}

function fakeStats(): IssueStats {
    return {
        totals: { total: 10 },
        statuses: [{ label: 'open', color: '#00ff00', count: 7 }],
        priorities: { low: 1, medium: 2, high: 3, critical: 4 },
        types: { bug: 3, feature: 2, task: 4, incident: 1 },
        activity: { createdToday: 2, closedToday: 1 },
        trend: { labels: ['Mon'], created: [2], closed: [1] },
    };
}

// ---------- test suite ----------

describe('IssueService', () => {
    let service: IssueService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(IssueService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // Verify no unmatched requests remain after every test
        httpTesting.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== createIssue ====================

    describe('createIssue', () => {
        it('should POST to the correct URL and return the created issue', () => {
            const newIssue: Partial<Issue> = { title: 'New issue', type: IssueType.FEATURE };
            const expected = fakeIssue({ title: 'New issue', type: IssueType.FEATURE });

            service.createIssue(ids, newIssue).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(newIssue);
            req.flush(expected);
        });

        it('should send an empty body when no fields are provided', () => {
            service.createIssue(ids, {}).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue`);
            expect(req.request.body).toEqual({});
            req.flush(fakeIssue());
        });
    });

    // ==================== getIssues ====================

    describe('getIssues', () => {
        it('should GET issues with no query params by default', () => {
            const expected = fakePaginated([fakeIssue()]);

            service.getIssues(ids).subscribe((result) => {
                expect(result).toEqual(expected);
                expect(result.items.length).toBe(1);
            });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue`);
            expect(req.request.method).toBe('GET');
            expect(req.request.params.keys().length).toBe(0);
            req.flush(expected);
        });

        it('should pass query params (page, sort, expand)', () => {
            const qp = { page: 2, pageSize: 10, sort: '-createdAt', expand: 'creator' };

            service.getIssues(ids, qp).subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/${PROJECT}/issue`);
            expect(req.request.params.get('page')).toBe('2');
            expect(req.request.params.get('pageSize')).toBe('10');
            expect(req.request.params.get('sort')).toBe('-createdAt');
            expect(req.request.params.get('expand')).toBe('creator');
            req.flush(fakePaginated([]));
        });

        it('should filter out null and undefined params', () => {
            service.getIssues(ids, { page: null, sort: undefined, expand: 'creator' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/${PROJECT}/issue`);
            expect(req.request.params.has('page')).toBeFalse();
            expect(req.request.params.has('sort')).toBeFalse();
            expect(req.request.params.get('expand')).toBe('creator');
            req.flush(fakePaginated([]));
        });

        it('should return empty items when API returns none', () => {
            const empty = fakePaginated<Issue>([]);

            service.getIssues(ids).subscribe((result) => {
                expect(result.items).toEqual([]);
                expect(result._meta.totalCount).toBe(0);
            });

            httpTesting.expectOne(`/${ORG}/${PROJECT}/issue`).flush(empty);
        });
    });

    // ==================== getIssueById ====================

    describe('getIssueById', () => {
        it('should GET a single issue with default expand params', () => {
            const expected = fakeIssue();

            service
                .getIssueById({ issueId: ISSUE_ID, projectId: PROJECT, organizationId: ORG })
                .subscribe((result) => {
                    expect(result).toEqual(expected);
                });

            const req = httpTesting.expectOne(
                (r) => r.url === `/${ORG}/${PROJECT}/issue/${ISSUE_ID}`
            );
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('expand')).toBe('creator,assignee,updator,label');
            req.flush(expected);
        });

        it('should use custom expand params when provided', () => {
            service
                .getIssueById({
                    issueId: ISSUE_ID,
                    projectId: PROJECT,
                    organizationId: ORG,
                    expand: 'creator',
                })
                .subscribe();

            const req = httpTesting.expectOne(
                (r) => r.url === `/${ORG}/${PROJECT}/issue/${ISSUE_ID}`
            );
            expect(req.request.params.get('expand')).toBe('creator');
            req.flush(fakeIssue());
        });
    });

    // ==================== getIssuesSimple ====================

    describe('getIssuesSimple', () => {
        it('should return only the items array from the paginated response', () => {
            const issues = [fakeIssue(), fakeIssue({ id: 'issue-43', title: 'Another bug' })];

            service
                .getIssuesSimple({ projectId: PROJECT, organizationId: ORG })
                .subscribe((result) => {
                    expect(result).toEqual(issues);
                    expect(result.length).toBe(2);
                });

            httpTesting.expectOne(`/${ORG}/${PROJECT}/issue`).flush(fakePaginated(issues));
        });

        it('should forward custom query params', () => {
            service
                .getIssuesSimple({
                    projectId: PROJECT,
                    organizationId: ORG,
                    queryParams: { page: 3 },
                })
                .subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/${PROJECT}/issue`);
            expect(req.request.params.get('page')).toBe('3');
            req.flush(fakePaginated([]));
        });

        it('should return an empty array when there are no issues', () => {
            service
                .getIssuesSimple({ projectId: PROJECT, organizationId: ORG })
                .subscribe((result) => {
                    expect(result).toEqual([]);
                });

            httpTesting.expectOne(`/${ORG}/${PROJECT}/issue`).flush(fakePaginated([]));
        });
    });

    // ==================== updateIssue ====================

    describe('updateIssue', () => {
        it('should PUT the partial issue to the correct URL', () => {
            const patch: Partial<Issue> = { title: 'Updated title' };
            const expected = fakeIssue({ title: 'Updated title' });

            service
                .updateIssue({
                    issueId: ISSUE_ID,
                    projectId: PROJECT,
                    organizationId: ORG,
                    issue: patch,
                })
                .subscribe((result) => {
                    expect(result.title).toBe('Updated title');
                });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue/${ISSUE_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(patch);
            req.flush(expected);
        });

        it('should send only the fields included in the partial', () => {
            const patch: Partial<Issue> = { priority: IssuePriority.CRITICAL };

            service
                .updateIssue({
                    issueId: ISSUE_ID,
                    projectId: PROJECT,
                    organizationId: ORG,
                    issue: patch,
                })
                .subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue/${ISSUE_ID}`);
            expect(req.request.body).toEqual({ priority: IssuePriority.CRITICAL });
            req.flush(fakeIssue(patch));
        });
    });

    // ==================== deleteIssue ====================

    describe('deleteIssue', () => {
        it('should DELETE the issue at the correct URL', () => {
            service
                .deleteIssue({ issueId: ISSUE_ID, projectId: PROJECT, organizationId: ORG })
                .subscribe((result) => {
                    expect(result).toBeNull();
                });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue/${ISSUE_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== getStats ====================

    describe('getStats', () => {
        it('should GET issue statistics from the correct URL', () => {
            const expected = fakeStats();

            service.getStats(ids).subscribe((result) => {
                expect(result).toEqual(expected);
                expect(result.totals.total).toBe(10);
            });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/issue/stats`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should return all stat fields correctly', () => {
            const expected = fakeStats();

            service.getStats(ids).subscribe((result) => {
                expect(result.priorities).toEqual({
                    low: 1,
                    medium: 2,
                    high: 3,
                    critical: 4,
                });
                expect(result.types.bug).toBe(3);
                expect(result.activity.createdToday).toBe(2);
                expect(result.trend.labels).toEqual(['Mon']);
            });

            httpTesting.expectOne(`/${ORG}/${PROJECT}/issue/stats`).flush(expected);
        });
    });

    // ==================== closeIssue ====================

    describe('closeIssue', () => {
        const closeData = { issueId: ISSUE_ID, projectId: PROJECT, organizationId: ORG };

        it('should POST to the close endpoint with default expand params', () => {
            const expected = fakeIssue({ statusLabel: 'closed', closedAt: 1700001000 });

            service.closeIssue(closeData).subscribe((result) => {
                expect(result.statusLabel).toBe('closed');
                expect(result.closedAt).toBeTruthy();
            });

            const req = httpTesting.expectOne(
                (r) => r.url === `/${ORG}/${PROJECT}/issue/${ISSUE_ID}/close`
            );
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({});
            expect(req.request.params.get('expand')).toBe('creator,assignee,updator,label');
            req.flush(expected);
        });

        it('should use custom params when provided', () => {
            service.closeIssue(closeData, { expand: 'creator' }).subscribe();

            const req = httpTesting.expectOne(
                (r) => r.url === `/${ORG}/${PROJECT}/issue/${ISSUE_ID}/close`
            );
            expect(req.request.params.get('expand')).toBe('creator');
            req.flush(fakeIssue());
        });
    });

    // ==================== openIssue ====================

    describe('openIssue', () => {
        const openData = { issueId: ISSUE_ID, projectId: PROJECT, organizationId: ORG };

        it('should POST to the open endpoint with default expand params', () => {
            const expected = fakeIssue({ statusLabel: 'open', closedAt: null });

            service.openIssue(openData).subscribe((result) => {
                expect(result.statusLabel).toBe('open');
                expect(result.closedAt).toBeNull();
            });

            const req = httpTesting.expectOne(
                (r) => r.url === `/${ORG}/${PROJECT}/issue/${ISSUE_ID}/open`
            );
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({});
            expect(req.request.params.get('expand')).toBe('creator,assignee,updator,label');
            req.flush(expected);
        });

        it('should use custom params when provided', () => {
            service.openIssue(openData, { expand: 'assignee' }).subscribe();

            const req = httpTesting.expectOne(
                (r) => r.url === `/${ORG}/${PROJECT}/issue/${ISSUE_ID}/open`
            );
            expect(req.request.params.get('expand')).toBe('assignee');
            req.flush(fakeIssue());
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors to the subscriber', () => {
            service.getIssues(ids).subscribe({
                next: () => fail('expected an error'),
                error: (err) => {
                    expect(err.status).toBe(500);
                    expect(err.statusText).toBe('Internal Server Error');
                },
            });

            httpTesting
                .expectOne(`/${ORG}/${PROJECT}/issue`)
                .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
        });

        it('should propagate 404 for a missing issue', () => {
            service
                .getIssueById({ issueId: 'nonexistent', projectId: PROJECT, organizationId: ORG })
                .subscribe({
                    next: () => fail('expected an error'),
                    error: (err) => {
                        expect(err.status).toBe(404);
                    },
                });

            httpTesting
                .expectOne((r) => r.url === `/${ORG}/${PROJECT}/issue/nonexistent`)
                .flush('Not found', { status: 404, statusText: 'Not Found' });
        });

        it('should propagate 422 validation error on create', () => {
            service.createIssue(ids, { title: '' }).subscribe({
                next: () => fail('expected an error'),
                error: (err) => {
                    expect(err.status).toBe(422);
                },
            });

            httpTesting
                .expectOne(`/${ORG}/${PROJECT}/issue`)
                .flush([{ field: 'title', message: 'Title cannot be blank' }], {
                    status: 422,
                    statusText: 'Unprocessable Entity',
                });
        });
    });

    // ==================== URL construction ====================

    describe('URL construction', () => {
        it('should embed organization and project IDs in the URL for all methods', () => {
            const customIds = { organizationId: 'acme-corp', projectId: 'website' };

            service.getIssues(customIds).subscribe();
            httpTesting.expectOne('/acme-corp/website/issue').flush(fakePaginated([]));

            service.createIssue(customIds, { title: 'test' }).subscribe();
            httpTesting.expectOne('/acme-corp/website/issue').flush(fakeIssue());

            service.getStats(customIds).subscribe();
            httpTesting.expectOne('/acme-corp/website/issue/stats').flush(fakeStats());
        });
    });
});
