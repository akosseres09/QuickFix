import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OrganizationInvitationComponent } from './organization-invitation.component';
import { OrganizationInvitationService } from '../../shared/services/organization-invitation/organization-invitation.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

describe('OrganizationInvitationComponent', () => {
    let component: OrganizationInvitationComponent;
    let fixture: ComponentFixture<OrganizationInvitationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrganizationInvitationComponent],
            providers: [
                provideRouter([]),
                {
                    provide: OrganizationInvitationService,
                    useValue: {
                        getInvitations: () =>
                            of({
                                items: [],
                                _meta: {
                                    totalCount: 0,
                                    pageCount: 0,
                                    currentPage: 1,
                                    perPage: 20,
                                },
                                _links: {
                                    self: {
                                        href: '',
                                    },
                                },
                            }),
                    },
                },
                {
                    provide: SnackbarService,
                    useValue: {
                        success: () => {},
                        error: () => {},
                        open: () => {},
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OrganizationInvitationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
