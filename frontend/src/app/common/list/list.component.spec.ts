import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageEvent } from '@angular/material/paginator';
import { ListComponent, SortableColumn } from './list.component';
import { BaseModel } from '../../shared/model/BaseModel';

interface TestItem extends BaseModel {
    id: string;
    name: string;
}

describe('ListComponent', () => {
    let component: ListComponent<TestItem>;
    let fixture: ComponentFixture<ListComponent<TestItem>>;

    const testData: TestItem[] = [
        { id: '1', name: 'Item A' },
        { id: '2', name: 'Item B' },
        { id: '3', name: 'Item C' },
    ];

    const testColumns: SortableColumn[] = [
        { id: 'name', label: 'Name' },
        { id: 'id', label: 'ID' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListComponent, NoopAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(ListComponent<TestItem>);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('data', testData);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('default inputs', () => {
        it('should default listHeader to empty string', () => {
            expect(component.listHeader()).toBe('');
        });

        it('should default isLoading to false', () => {
            expect(component.isLoading()).toBeFalse();
        });

        it('should default initialPageSize to 20', () => {
            expect(component.initialPageSize()).toBe(20);
        });

        it('should default enablePagination to true', () => {
            expect(component.enablePagination()).toBeTrue();
        });

        it('should default disableSelection to false', () => {
            expect(component.disableSelection()).toBeFalse();
        });

        it('should default selectedRow to null', () => {
            expect(component.selectedRow()).toBeNull();
        });
    });

    describe('toggleRow', () => {
        it('should select a row', () => {
            component.toggleRow(testData[0]);
            expect(component.selectedRow()).toEqual(testData[0]);
        });

        it('should deselect the same row when toggled again', () => {
            component.toggleRow(testData[0]);
            component.toggleRow(testData[0]);
            expect(component.selectedRow()).toBeNull();
        });

        it('should select a different row', () => {
            component.toggleRow(testData[0]);
            component.toggleRow(testData[1]);
            expect(component.selectedRow()).toEqual(testData[1]);
        });

        it('should not select a disabled row', () => {
            fixture.componentRef.setInput('disableSelection', true);
            fixture.detectChanges();

            component.toggleRow(testData[0]);
            expect(component.selectedRow()).toBeNull();
        });

        it('should respect function-based disableSelection', () => {
            fixture.componentRef.setInput('disableSelection', (row: TestItem) => row.id === '1');
            fixture.detectChanges();

            component.toggleRow(testData[0]);
            expect(component.selectedRow()).toBeNull();

            component.toggleRow(testData[1]);
            expect(component.selectedRow()).toEqual(testData[1]);
        });
    });

    describe('isRowDisabled', () => {
        it('should return false when disableSelection is false', () => {
            expect(component.isRowDisabled(testData[0])).toBeFalse();
        });

        it('should return true when disableSelection is true', () => {
            fixture.componentRef.setInput('disableSelection', true);
            fixture.detectChanges();
            expect(component.isRowDisabled(testData[0])).toBeTrue();
        });

        it('should call function when disableSelection is a function', () => {
            const fn = (row: TestItem) => row.id === '2';
            fixture.componentRef.setInput('disableSelection', fn);
            fixture.detectChanges();

            expect(component.isRowDisabled(testData[0])).toBeFalse();
            expect(component.isRowDisabled(testData[1])).toBeTrue();
        });
    });

    describe('sort controls', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('sortableColumns', testColumns);
            fixture.detectChanges();
        });

        it('should emit sortChange on sort field change', () => {
            const spy = spyOn(component.sortChange, 'emit');
            component.onSortFieldChange('name');

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({ active: 'name', direction: 'asc' })
            );
        });

        it('should toggle sort direction', () => {
            component.onSortFieldChange('name');

            const spy = spyOn(component.sortChange, 'emit');
            component.onSortDirectionToggle();

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({ active: 'name', direction: 'desc' })
            );
        });

        it('should clear sort', () => {
            component.onSortFieldChange('name');

            const spy = spyOn(component.sortChange, 'emit');
            component.onClearSort();

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({ active: '', direction: '' })
            );
        });
    });

    describe('onPageEvent', () => {
        it('should emit pageChange', () => {
            const spy = spyOn(component.pageChange, 'emit');
            const event: PageEvent = { pageIndex: 1, pageSize: 20, length: 100 };
            component.onPageEvent(event);

            expect(spy).toHaveBeenCalledWith(event);
        });

        it('should not emit when pagination is disabled', () => {
            fixture.componentRef.setInput('enablePagination', false);
            fixture.detectChanges();

            const spy = spyOn(component.pageChange, 'emit');
            component.onPageEvent({ pageIndex: 1, pageSize: 20, length: 100 });

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('template', () => {
        it('should render list header', () => {
            fixture.componentRef.setInput('listHeader', 'Test List');
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('h2')?.textContent).toContain('Test List');
        });

        it('should show spinner when loading', () => {
            fixture.componentRef.setInput('isLoading', true);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-spinner')).toBeTruthy();
        });

        it('should show "No data available" when data is empty', () => {
            fixture.componentRef.setInput('data', []);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.textContent).toContain('No data available');
        });

        it('should render data items', () => {
            fixture.componentRef.setInput('data', testData);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            // Items render as rows (no template so they'll be empty containers)
            const rows = el.querySelectorAll('.border-t');
            expect(rows.length).toBe(testData.length);
        });

        it('should render paginator when pagination is enabled', () => {
            fixture.componentRef.setInput('totalCount', 100);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-paginator')).toBeTruthy();
        });
    });
});
