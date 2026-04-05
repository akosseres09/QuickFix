import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobilePaginatorComponent } from './mobile-paginator.component';

describe('MobilePaginatorComponent', () => {
    let component: MobilePaginatorComponent;
    let fixture: ComponentFixture<MobilePaginatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MobilePaginatorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MobilePaginatorComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('pageIndex', 0);
        fixture.componentRef.setInput('pageSize', 20);
        fixture.componentRef.setInput('length', 100);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('computed signals', () => {
        it('should calculate totalPages correctly', () => {
            expect(component.totalPages()).toBe(5);
        });

        it('should return 0 totalPages when pageSize is 0', () => {
            fixture.componentRef.setInput('pageSize', 0);
            fixture.detectChanges();
            expect(component.totalPages()).toBe(0);
        });

        it('should calculate currentPage (1-indexed)', () => {
            expect(component.currentPage()).toBe(1);
        });

        it('should return true for isFirstPage on page 0', () => {
            expect(component.isFirstPage()).toBeTrue();
        });

        it('should return false for isFirstPage on page 2', () => {
            fixture.componentRef.setInput('pageIndex', 2);
            fixture.detectChanges();
            expect(component.isFirstPage()).toBeFalse();
        });

        it('should return false for isLastPage on first page', () => {
            expect(component.isLastPage()).toBeFalse();
        });

        it('should return true for isLastPage on last page', () => {
            fixture.componentRef.setInput('pageIndex', 4);
            fixture.detectChanges();
            expect(component.isLastPage()).toBeTrue();
        });
    });

    describe('navigation methods', () => {
        it('goToFirst should emit page event with index 0', () => {
            fixture.componentRef.setInput('pageIndex', 3);
            fixture.detectChanges();
            spyOn(component.page, 'emit');
            component.goToFirst();
            expect(component.page.emit).toHaveBeenCalledWith(
                jasmine.objectContaining({ pageIndex: 0, previousPageIndex: 3 })
            );
        });

        it('goToPrevious should emit page event with index - 1', () => {
            fixture.componentRef.setInput('pageIndex', 2);
            fixture.detectChanges();
            spyOn(component.page, 'emit');
            component.goToPrevious();
            expect(component.page.emit).toHaveBeenCalledWith(
                jasmine.objectContaining({ pageIndex: 1, previousPageIndex: 2 })
            );
        });

        it('goToNext should emit page event with index + 1', () => {
            spyOn(component.page, 'emit');
            component.goToNext();
            expect(component.page.emit).toHaveBeenCalledWith(
                jasmine.objectContaining({ pageIndex: 1, previousPageIndex: 0 })
            );
        });

        it('goToLast should emit page event with last page index', () => {
            spyOn(component.page, 'emit');
            component.goToLast();
            expect(component.page.emit).toHaveBeenCalledWith(
                jasmine.objectContaining({ pageIndex: 4, previousPageIndex: 0 })
            );
        });

        it('should include pageSize and length in emitted event', () => {
            spyOn(component.page, 'emit');
            component.goToNext();
            expect(component.page.emit).toHaveBeenCalledWith(
                jasmine.objectContaining({ pageSize: 20, length: 100 })
            );
        });
    });

    describe('template', () => {
        it('should render 4 navigation buttons', () => {
            const buttons = fixture.nativeElement.querySelectorAll('button');
            expect(buttons.length).toBe(4);
        });

        it('should display current page / total pages', () => {
            const spans = fixture.nativeElement.querySelectorAll('span');
            const pageSpan = Array.from(spans).find((s: any) =>
                s.textContent.trim().match(/^\d+ \/ \d+$/)
            ) as HTMLElement;
            expect(pageSpan).toBeTruthy();
            expect(pageSpan.textContent!.trim()).toBe('1 / 5');
        });

        it('should disable first and previous buttons on first page', () => {
            const buttons = fixture.nativeElement.querySelectorAll('button');
            expect(buttons[0].disabled).toBeTrue(); // first
            expect(buttons[1].disabled).toBeTrue(); // previous
        });

        it('should disable next and last buttons on last page', () => {
            fixture.componentRef.setInput('pageIndex', 4);
            fixture.detectChanges();
            const buttons = fixture.nativeElement.querySelectorAll('button');
            expect(buttons[2].disabled).toBeTrue(); // next
            expect(buttons[3].disabled).toBeTrue(); // last
        });

        it('should disable all buttons when disabled is true', () => {
            fixture.componentRef.setInput('disabled', true);
            fixture.componentRef.setInput('pageIndex', 2);
            fixture.detectChanges();
            const buttons = fixture.nativeElement.querySelectorAll('button');
            Array.from(buttons).forEach((btn: any) => {
                expect(btn.disabled).toBeTrue();
            });
        });
    });
});
