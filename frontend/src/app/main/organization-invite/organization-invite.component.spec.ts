import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationInviteComponent } from './organization-invite.component';

describe('OrganizationInviteComponent', () => {
  let component: OrganizationInviteComponent;
  let fixture: ComponentFixture<OrganizationInviteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationInviteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationInviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
