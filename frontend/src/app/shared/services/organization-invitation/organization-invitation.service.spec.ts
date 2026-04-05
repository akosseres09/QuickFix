import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { OrganizationInvitationService } from './organization-invitation.service';
import {
    OrganizationInvitation,
    OrganizationInvitationStatus,
} from '../../model/OrganizationInvitation';
import { MemberRole } from '../../constants/Role';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const INVITE_ID = 'inv-1';

function fakeInvite(overrides: Partial<OrganizationInvitation> = {}): OrganizationInvitation {
    return {
        id: INVITE_ID,
        organizationId: 'org-1',
        inviterId: 'user-1',
        email: 'new@example.com',
        role: MemberRole.MEMBER,
        status: OrganizationInvitationStatus.Pending,
        createdAt: 1700000000,
        updatedAt: 1700000000,
        expiresAt: 1700100000,
        ...overrides,
    };
}

function fakePaginated<T>(items: T[]): PaginatedResponse<T> {
    return {
        items,
        _meta: { totalCount: items.length, pageCount: 1, currentPage: 1, perPage: 20 },
        _links: { self: { href: '/invitation' } },
    };
}

describe('OrganizationInvitationService', () => {
    let service: OrganizationInvitationService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(OrganizationInvitationService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== sendInvitation ====================

    describe('sendInvitation', () => {
        it('should POST invitation data', () => {
            const data: Partial<OrganizationInvitation> = {
                organizationId: 'org-1',
                email: 'new@example.com',
                role: MemberRole.MEMBER,
            };
            const expected = fakeInvite();

            service.sendInvitation(data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne('/invitation');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(data);
            req.flush(expected);
        });
    });

    // ==================== getInvitations ====================

    describe('getInvitations', () => {
        it('should GET invitations with query params', () => {
            const expected = fakePaginated([fakeInvite()]);

            service.getInvitations({ page: 1, pageSize: 10 }).subscribe((result) => {
                expect(result.items.length).toBe(1);
            });

            const req = httpTesting.expectOne((r) => r.url === '/invitation');
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('page')).toBe('1');
            expect(req.request.params.get('pageSize')).toBe('10');
            req.flush(expected);
        });
    });

    // ==================== getInvitationById ====================

    describe('getInvitationById', () => {
        it('should GET a single invitation with expand params', () => {
            const expected = fakeInvite();

            service.getInvitationById(INVITE_ID).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne((r) => r.url === `/invitation/${INVITE_ID}`);
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('expand')).toBe('organization, inviter');
            req.flush(expected);
        });
    });

    // ==================== updateInvitation ====================

    describe('updateInvitation', () => {
        it('should PUT updated invitation data with expand params', () => {
            const data: Partial<OrganizationInvitation> = {
                status: OrganizationInvitationStatus.Accepted,
            };
            const expected = fakeInvite({ status: OrganizationInvitationStatus.Accepted });

            service.updateInvitation(INVITE_ID, data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne((r) => r.url === `/invitation/${INVITE_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(data);
            expect(req.request.params.get('expand')).toBe('organization, inviter');
            req.flush(expected);
        });
    });

    // ==================== session storage methods ====================

    describe('invitation token management', () => {
        afterEach(() => sessionStorage.clear());

        it('should store and retrieve invitation token', () => {
            service.setInvitationToken('test-token');
            expect(service.getInvitationToken()).toBe('test-token');
        });

        it('should delete invitation token', () => {
            service.setInvitationToken('test-token');
            service.deleteInvitationToken();
            expect(service.getInvitationToken()).toBeNull();
        });

        it('should return null when no token is set', () => {
            expect(service.getInvitationToken()).toBeNull();
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.getInvitationById('nonexistent').subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(404),
            });

            httpTesting
                .expectOne((r) => r.url === '/invitation/nonexistent')
                .flush('Not found', { status: 404, statusText: 'Not Found' });
        });
    });
});
