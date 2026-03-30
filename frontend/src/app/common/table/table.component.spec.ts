import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { TableComponent } from './table.component';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { BaseModel } from '../../shared/model/BaseModel';

interface TestRow extends BaseModel {
    id: string;
    name: string;
    status: string;
}

describe('TableComponent', () => {
    let component: TableComponent<TestRow>;
    let fixture: ComponentFixture<TableComponent<TestRow>>;

    const testRows: TestRow[] = [
        { id: '1', name: 'Row 1', status: 'active' },
        { id: '2', name: 'Row 2', status: 'closed' },
        { id: '3', name: 'Row 3', status: 'active' },
    ];

    const testColumns: DisplayedColumn<TestRow>[] = [
        { id: 'name', label: 'Name', sortable: true, value: (e) => e.name },
        { id: 'status', label: 'Status', sortable: false, value: (e) => e.status },
    ] as DisplayedColumn<TestRow>[];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TableComponent, NoopAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(TableComponent<TestRow>);
        component = fixture.componentInstance;

        const ds = new MatTableDataSource<TestRow>(testRows);
        fixture.componentRef.setInput('dataSource', ds);
        fixture.componentRef.setInput('displayedColumns', testColumns);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('default inputs', () => {
        it('should default tableHeader to empty string', () => {
            expect(component.tableHeader()).toBe('');
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

        it('should default selectedRow to null', () => {
            expect(component.selectedRow()).toBeNull();
        });
    });

    describe('columnIds', () => {
        it('should compute column IDs from displayedColumns', () => {
            expect(component.columnIds()).toEqual(['name', 'status']);
        });
    });

    describe('toggleRow', () => {
        it('should select a row', () => {
            component.toggleRow(testRows[0]);
            expect(component.selectedRow()).toEqual(testRows[0]);
        });

        it('should deselect the same row when toggled again', () => {
            component.toggleRow(testRows[0]);
            component.toggleRow(testRows[0]);
            expect(component.selectedRow()).toBeNull();
        });

        it('should select a different row', () => {
            component.toggleRow(testRows[0]);
            component.toggleRow(testRows[1]);
            expect(component.selectedRow()).toEqual(testRows[1]);
        });

        it('should not select a disabled row', () => {
            fixture.componentRef.setInput('disableSelection', true);
            fixture.detectChanges();

            component.toggleRow(testRows[0]);
            expect(component.selectedRow()).toBeNull();
        });
    });

    describe('isRowDisabled', () => {
        it('should return false by default', () => {
            expect(component.isRowDisabled(testRows[0])).toBeFalse();
        });

        it('should return true when disableSelection is true', () => {
            fixture.componentRef.setInput('disableSelection', true);
            fixture.detectChanges();
            expect(component.isRowDisabled(testRows[0])).toBeTrue();
        });

        it('should evaluate function-based disableSelection', () => {
            fixture.componentRef.setInput(
                'disableSelection',
                (row: TestRow) => row.status === 'closed'
            );
            fixture.detectChanges();

            expect(component.isRowDisabled(testRows[0])).toBeFalse();
            expect(component.isRowDisabled(testRows[1])).toBeTrue();
        });
    });

    describe('onSortChange', () => {
        it('should emit sortChange event', () => {
            const spy = spyOn(component.sortChange, 'emit');
            const sort: Sort = { active: 'name', direction: 'asc' };
            component.onSortChange(sort);
            expect(spy).toHaveBeenCalledWith(sort);
        });
    });

    describe('onPageEvent', () => {
        it('should emit pageChange event', () => {
            const spy = spyOn(component.pageChange, 'emit');
            const event: PageEvent = { pageIndex: 1, pageSize: 20, length: 100 };
            component.onPageEvent(event);
            expect(spy).toHaveBeenCalledWith(event);
        });

        it('should not emit when pagination is disabled', () => {
            fixture.componentRef.setInput('enablePagination', false);
            fixture.detectChanges();

            const spy = spyOn(component.pageChange, 'emit');
            component.onPageEvent({ pageIndex: 0, pageSize: 20, length: 100 });
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('template', () => {
        it('should render table header', () => {
            fixture.componentRef.setInput('tableHeader', 'Test Table');
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('h2')?.textContent).toContain('Test Table');
        });

        it('should render a table element', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('table')).toBeTruthy();
        });

        it('should render header cells for each column', () => {
            const el: HTMLElement = fixture.nativeElement;
            const headers = el.querySelectorAll('th');
            expect(headers.length).toBe(2);
        });

        it('should render data rows', () => {
            const el: HTMLElement = fixture.nativeElement;
            const rows = el.querySelectorAll('tr[mat-row]');
            expect(rows.length).toBe(3);
        });

        it('should show spinner when loading', () => {
            fixture.componentRef.setInput('isLoading', true);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-spinner')).toBeTruthy();
        });

        it('should show "No data available" when dataSource is empty', () => {
            fixture.componentRef.setInput('dataSource', new MatTableDataSource<TestRow>([]));
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.textContent).toContain('No data available');
        });

        it('should render paginator when pagination is enabled', () => {
            fixture.componentRef.setInput('totalCount', 100);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-paginator')).toBeTruthy();
        });
    });
});
