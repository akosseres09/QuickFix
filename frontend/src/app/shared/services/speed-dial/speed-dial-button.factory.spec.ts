import { TestBed } from '@angular/core/testing';

import { SpeedDialButtonFactory } from './speed-dial-button.factory';

describe('SpeedDialButtonFactory', () => {
    let service: SpeedDialButtonFactory;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SpeedDialButtonFactory);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
