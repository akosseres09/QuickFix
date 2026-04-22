import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { LabelService } from './label.service';
import { Label } from '../../model/Label';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG = 'org-1';
const PROJECT = 'proj-1';
const LABEL_ID = 'label-1';

function fakeLabel(overrides: Partial<Label> = {}): Label {
    return {
        id: LABEL_ID,
        name: 'In Progress',
        description: 'Work is underway',
        color: '#3b82f6',
        projectId: PROJECT,
        ...overrides,
    };
}

function fakePaginated<T>(items: T[]): PaginatedResponse<T> {
    return {
        items,
        _meta: { totalCount: items.length, pageCount: 1, currentPage: 1, perPage: 20 },
        _links: { self: { href: '/label' } },
    };
}

describe('LabelService', () => {
    let service: LabelService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(LabelService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== createLabel ====================

    describe('createLabel', () => {
        it('should POST the label data to the correct URL', () => {
            const label: Omit<Label, 'id' | 'projectId'> = {
                name: 'Done',
                description: 'Completed work',
                color: '#22c55e',
            };
            const expected = fakeLabel({
                name: 'Done',
                description: 'Completed work',
                color: '#22c55e',
            });

            service
                .createLabel({ organizationId: ORG, projectId: PROJECT, label })
                .subscribe((result) => {
                    expect(result).toEqual(expected);
                });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/label`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(label);
            req.flush(expected);
        });
    });

    // ==================== getLabelsToProject ====================

    describe('getLabelsToProject', () => {
        it('should GET labels with no query params', () => {
            const expected = fakePaginated([fakeLabel()]);

            service
                .getLabelsToProject({ organizationId: ORG, projectId: PROJECT })
                .subscribe((result) => {
                    expect(result.items.length).toBe(1);
                });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/label`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params when provided', () => {
            service
                .getLabelsToProject({
                    organizationId: ORG,
                    projectId: PROJECT,
                    queryParams: { page: 1, pageSize: 50 },
                })
                .subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/${PROJECT}/label`);
            expect(req.request.params.get('page')).toBe('1');
            expect(req.request.params.get('pageSize')).toBe('50');
            req.flush(fakePaginated([]));
        });
    });

    // ==================== updateLabel ====================

    describe('updateLabel', () => {
        it('should PUT updated label data', () => {
            const label: Omit<Label, 'id'> = {
                name: 'Renamed',
                description: 'Updated',
                color: '#ef4444',
                projectId: PROJECT,
            };
            const expected = fakeLabel({ name: 'Renamed' });

            service
                .updateLabel({ organizationId: ORG, projectId: PROJECT, labelId: LABEL_ID, label })
                .subscribe((result) => {
                    expect(result).toEqual(expected);
                });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/label/${LABEL_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(label);
            req.flush(expected);
        });
    });

    // ==================== reorderLabel ====================

    describe('reorderLabel', () => {
        it('should POST reorder with new_index in the body', () => {
            service
                .reorderLabel({
                    organizationId: ORG,
                    projectId: PROJECT,
                    labelId: LABEL_ID,
                    newIndex: 3,
                })
                .subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/label/${LABEL_ID}/reorder`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ new_index: 3 });
            req.flush(fakeLabel());
        });
    });

    // ==================== deleteLabel ====================

    describe('deleteLabel', () => {
        it('should DELETE at the correct URL', () => {
            service
                .deleteLabel({ organizationId: ORG, projectId: PROJECT, labelId: LABEL_ID })
                .subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/label/${LABEL_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate 409 conflict when deleting a label in use', () => {
            service
                .deleteLabel({ organizationId: ORG, projectId: PROJECT, labelId: LABEL_ID })
                .subscribe({
                    next: () => fail('expected error'),
                    error: (err) => expect(err.status).toBe(409),
                });

            httpTesting
                .expectOne(`/${ORG}/${PROJECT}/label/${LABEL_ID}`)
                .flush('Label in use', { status: 409, statusText: 'Conflict' });
        });
    });
});
