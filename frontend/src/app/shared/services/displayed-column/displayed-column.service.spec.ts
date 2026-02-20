import { TestBed } from '@angular/core/testing';

import { DisplayedColumnService } from './displayed-column.service';

describe('DisplayedColumnService', () => {
  let service: DisplayedColumnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisplayedColumnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
