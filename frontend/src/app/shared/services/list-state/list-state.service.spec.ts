import { TestBed } from '@angular/core/testing';

import { ListStateService } from './list-state.service';

describe('ListStateService', () => {
    let service: ListStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ListStateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
