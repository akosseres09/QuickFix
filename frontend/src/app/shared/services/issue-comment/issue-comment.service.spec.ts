import { TestBed } from '@angular/core/testing';

import { IssueCommentService } from './issue-comment.service';

describe('IssueCommentService', () => {
  let service: IssueCommentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueCommentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
