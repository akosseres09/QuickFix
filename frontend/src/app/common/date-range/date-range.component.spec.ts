import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateRangeComponent } from './date-range.component';

describe('DateRangeComponent', () => {
    let component: DateRangeComponent;
    let fixture: ComponentFixture<DateRangeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DateRangeComponent, NoopAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(DateRangeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('range form group', () => {
        it('should have startDate and endDate controls', () => {
            expect(component.range.get('startDate')).toBeTruthy();
            expect(component.range.get('endDate')).toBeTruthy();
        });

        it('should initialize with dates', () => {
            expect(component.range.get('startDate')!.value).toBeTruthy();
            expect(component.range.get('endDate')!.value).toBeTruthy();
        });

        it('should be invalid when startDate is null', () => {
            component.range.get('startDate')!.setValue(null);
            component.range.get('endDate')!.setValue(new Date());
            expect(component.range.get('startDate')!.hasError('required')).toBeTrue();
        });

        it('should be invalid when endDate is null', () => {
            component.range.get('startDate')!.setValue(new Date());
            component.range.get('endDate')!.setValue(null);
            expect(component.range.get('endDate')!.hasError('required')).toBeTrue();
        });
    });

    describe('dateRangeChange output', () => {
        it('should emit when form values change and are valid', fakeAsync(() => {
            const spy = spyOn(component.dateRangeChange, 'emit');
            const start = new Date(2024, 0, 1);
            const end = new Date(2024, 0, 7);

            component.range.get('startDate')!.setValue(start);
            component.range.get('endDate')!.setValue(end);
            tick(300);

            expect(spy).toHaveBeenCalled();
            const emitted = spy.calls.mostRecent().args[0];
            expect(emitted.startDate).toBeTruthy();
            expect(emitted.endDate).toBeTruthy();
        }));

        it('should not emit when form is invalid', fakeAsync(() => {
            const spy = spyOn(component.dateRangeChange, 'emit');
            component.range.get('startDate')!.setValue(null);
            component.range.get('endDate')!.setValue(null);
            tick(300);

            expect(spy).not.toHaveBeenCalled();
        }));
    });

    describe('date validation', () => {
        it('should set minDateViolation error when start is before minDate', () => {
            const minDate = new Date(2024, 5, 1);
            fixture.componentRef.setInput('minDate', minDate);
            fixture.detectChanges();

            component.range.get('startDate')!.setValue(new Date(2024, 0, 1));
            component.range.get('endDate')!.setValue(new Date(2024, 6, 1));

            expect(component.range.hasError('minDateViolation')).toBeTrue();
        });

        it('should set maxDateViolation error when end is after maxDate', () => {
            const maxDate = new Date(2024, 5, 1);
            fixture.componentRef.setInput('maxDate', maxDate);
            fixture.detectChanges();

            component.range.get('startDate')!.setValue(new Date(2024, 0, 1));
            component.range.get('endDate')!.setValue(new Date(2025, 0, 1));

            expect(component.range.hasError('maxDateViolation')).toBeTrue();
        });

        it('should set invalidRange error when start is after end', () => {
            component.range.get('startDate')!.setValue(new Date(2025, 0, 1));
            component.range.get('endDate')!.setValue(new Date(2024, 0, 1));

            expect(component.range.hasError('invalidRange')).toBeTrue();
        });

        it('should have no errors for a valid range', () => {
            component.range.get('startDate')!.setValue(new Date(2024, 0, 1));
            component.range.get('endDate')!.setValue(new Date(2024, 6, 1));

            expect(component.range.errors).toBeNull();
        });
    });

    describe('template', () => {
        it('should render mat-form-field', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-form-field')).toBeTruthy();
        });

        it('should render start and end date inputs', () => {
            const el: HTMLElement = fixture.nativeElement;
            const inputs = el.querySelectorAll('input');
            expect(inputs.length).toBe(2);
        });

        it('should render a datepicker toggle', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-datepicker-toggle')).toBeTruthy();
        });
    });
});
