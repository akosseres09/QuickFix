import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { WorktimeService, WorktimeStats } from './worktime.service';
import { Worktime } from '../../model/Worktime';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG = 'org-1';
const WORKTIME_ID = 'wt-1';

function fakeWorktime(overrides: Partial<Worktime> = {}): Worktime {
    return {
        id: WORKTIME_ID,
        issueId: 'issue-1',
        createdBy: 'user-1',
        updatedBy: null,
        minutesSpent: 120,
        description: 'Worked on login',
        loggedAt: '2024-01-15',
        createdAt: 1700000000,
        updatedAt: null,
        ...overrides,
    };
}

function fakePaginated<T>(items: T[]): PaginatedResponse<T> {
    return {
        items,
        _meta: { totalCount: items.length, pageCount: 1, currentPage: 1, perPage: 20 },
        _links: { self: { href: '/worktime' } },
    };
}

function fakeStats(): WorktimeStats {
    return {
        totalHours: 40,
        totalEntries: 15,
        avgHoursPerDay: 5,
        mostProductiveDay: { date: '2024-01-15', hours: 8 },
        hoursPerDay: [{ date: '2024-01-15', hours: 8 }],
        hoursPerUser: [{ userId: 'user-1', hours: 20 }],
    };
}

describe('WorktimeService', () => {
    let service: WorktimeService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(WorktimeService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getWorktime ====================

    describe('getWorktime', () => {
        it('should GET worktime entries with no params', () => {
            const expected = fakePaginated([fakeWorktime()]);

            service.getWorktime(ORG).subscribe((result) => {
                expect(result.items.length).toBe(1);
            });

            const req = httpTesting.expectOne(`/${ORG}/worktime`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params', () => {
            service.getWorktime(ORG, { page: 2, sort: '-loggedAt' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/worktime`);
            expect(req.request.params.get('page')).toBe('2');
            expect(req.request.params.get('sort')).toBe('-loggedAt');
            req.flush(fakePaginated([]));
        });
    });

    // ==================== getStats ====================

    describe('getStats', () => {
        it('should GET stats from the correct URL', () => {
            const expected = fakeStats();

            service.getStats(ORG).subscribe((result) => {
                expect(result).toEqual(expected);
                expect(result.totalHours).toBe(40);
            });

            const req = httpTesting.expectOne(`/${ORG}/worktime/stats`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params for stats', () => {
            service.getStats(ORG, { expand: 'user' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/worktime/stats`);
            expect(req.request.params.get('expand')).toBe('user');
            req.flush(fakeStats());
        });
    });

    // ==================== createWorktime ====================

    describe('createWorktime', () => {
        it('should POST worktime data', () => {
            const data = {
                issue_id: 'issue-1',
                minutes_spent: 60,
                logged_at: '2024-01-15',
                description: 'Bug fix',
            };
            const expected = fakeWorktime({ minutesSpent: 60, description: 'Bug fix' });

            service.createWorktime(ORG, data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/worktime`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(data);
            req.flush(expected);
        });

        it('should work without optional description', () => {
            const data = { issue_id: 'issue-1', minutes_spent: 30, logged_at: '2024-01-16' };

            service.createWorktime(ORG, data).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/worktime`);
            expect(req.request.body.description).toBeUndefined();
            req.flush(fakeWorktime());
        });
    });

    // ==================== updateWorktime ====================

    describe('updateWorktime', () => {
        it('should PUT partial data to the correct URL', () => {
            const data = { minutes_spent: 180 };

            service.updateWorktime(ORG, WORKTIME_ID, data).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/worktime/${WORKTIME_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(data);
            req.flush(fakeWorktime({ minutesSpent: 180 }));
        });
    });

    // ==================== deleteWorktime ====================

    describe('deleteWorktime', () => {
        it('should DELETE at the correct URL', () => {
            service.deleteWorktime(ORG, WORKTIME_ID).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/worktime/${WORKTIME_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.getWorktime(ORG).subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(404),
            });

            httpTesting
                .expectOne(`/${ORG}/worktime`)
                .flush('Not found', { status: 404, statusText: 'Not Found' });
        });
    });
});
