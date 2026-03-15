import { TestBed } from '@angular/core/testing';

import { OrganizationInvitationService } from './organization-invitation.service';

describe('OrganizationInvitationService', () => {
  let service: OrganizationInvitationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationInvitationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
