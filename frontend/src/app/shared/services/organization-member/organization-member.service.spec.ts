import { TestBed } from '@angular/core/testing';

import { OrganizationMemberService } from './organization-member.service';

describe('OrganizationMemberService', () => {
  let service: OrganizationMemberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationMemberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
