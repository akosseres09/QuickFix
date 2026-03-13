import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationInvitationItemComponent } from './organization-invitation-item.component';

describe('OrganizationInvitationItemComponent', () => {
    let component: OrganizationInvitationItemComponent;
    let fixture: ComponentFixture<OrganizationInvitationItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrganizationInvitationItemComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(OrganizationInvitationItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
