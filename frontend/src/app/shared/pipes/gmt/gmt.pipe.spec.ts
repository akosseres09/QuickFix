import { TestBed } from '@angular/core/testing';
import { GMTPipe } from './gmt.pipe';
import { DateService } from '../../services/date/date.service';

describe('GMTPipe', () => {
    let pipe: GMTPipe;
    let mockDateService: jasmine.SpyObj<DateService>;

    beforeEach(() => {
        mockDateService = jasmine.createSpyObj('DateService', ['toGMTtime']);

        TestBed.configureTestingModule({
            providers: [GMTPipe, { provide: DateService, useValue: mockDateService }],
        });

        pipe = TestBed.inject(GMTPipe);
    });

    it('should create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    // ==================== Delegation to DateService ====================

    describe('transform delegation', () => {
        it('should call DateService.toGMTtime with a Date object', () => {
            mockDateService.toGMTtime.and.returnValue('January 1, 2025 at 12:00:00 PM GMT+1');
            const result = pipe.transform('2025-01-01T11:00:00Z');

            expect(mockDateService.toGMTtime).toHaveBeenCalled();
            expect(result).toBe('January 1, 2025 at 12:00:00 PM GMT+1');
        });

        it('should convert a string input to a Date before calling toGMTtime', () => {
            mockDateService.toGMTtime.and.returnValue('formatted');
            pipe.transform('2025-06-15T10:30:00Z');

            const passedDate = mockDateService.toGMTtime.calls.first().args[0];
            expect(passedDate).toBeInstanceOf(Date);
        });

        it('should convert a number (timestamp) input to a Date', () => {
            mockDateService.toGMTtime.and.returnValue('formatted');
            const timestamp = new Date('2025-01-01').getTime();
            pipe.transform(timestamp);

            const passedDate = mockDateService.toGMTtime.calls.first().args[0];
            expect(passedDate).toBeInstanceOf(Date);
            expect(passedDate.getTime()).toBe(timestamp);
        });

        it('should pass through a Date input directly', () => {
            mockDateService.toGMTtime.and.returnValue('formatted');
            const date = new Date('2025-03-15T12:00:00Z');
            pipe.transform(date);

            const passedDate = mockDateService.toGMTtime.calls.first().args[0];
            expect(passedDate.getTime()).toBe(date.getTime());
        });

        it('should return whatever DateService returns', () => {
            const formatted = 'March 15, 2025 at 3:00:00 PM GMT+3';
            mockDateService.toGMTtime.and.returnValue(formatted);

            expect(pipe.transform('2025-03-15')).toBe(formatted);
        });

        it('should call toGMTtime exactly once per invocation', () => {
            mockDateService.toGMTtime.and.returnValue('result');
            pipe.transform('2025-01-01');
            pipe.transform('2025-02-01');

            expect(mockDateService.toGMTtime).toHaveBeenCalledTimes(2);
        });
    });
});
