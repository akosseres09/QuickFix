import {
    Component,
    inject,
    model,
    input,
    output,
    effect,
    computed,
    viewChild,
    DestroyRef,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortHeader, Sort, SortDirection } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { BaseModel } from '../../shared/model/BaseModel';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-table',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSort,
        MatSortHeader,
        MatProgressSpinner,
        RouterLink,
    ],
    templateUrl: './table.component.html',
    styleUrl: './table.component.css',
})
export class TableComponent<T extends BaseModel> {
    dataSource = model<MatTableDataSource<T>>(new MatTableDataSource<T>([]));
    displayedColumns = input<Array<DisplayedColumn<T>>>([]);

    tableHeader = input<string>('');
    isLoading = input<boolean>(false);

    initialPageSize = input<number>(20);
    initialPageIndex = input<number>(0);
    initialSortActive = input<string>('');
    initialSortDirection = input<SortDirection>('asc');
    totalCount = input<number>(0);

    edit = output<T>();
    delete = output<T>();
    name = output<T>();
    sortChange = output<Sort>();
    pageChange = output<PageEvent>();

    private readonly destroyRef = inject(DestroyRef);

    selectedRow = model<T | null>(null);

    columnIds = computed<string[]>(() => this.displayedColumns().map((col) => col.id));

    paginator = viewChild(MatPaginator);
    sort = viewChild(MatSort);

    protected readonly pageSizes = [5, 10, 20, 30, 50];

    constructor() {
        // For server-side pagination/sorting, we don't bind the paginator/sort to dataSource
        // The dataSource just holds the current page of data
        // The paginator and sort are UI-only controls that emit events
        effect(() => {
            const s = this.sort();
            if (s) {
                s.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
                    const p = this.paginator();
                    if (p) {
                        p.pageIndex = 0;
                    }
                });
            }
        });
    }

    onSortChange(event: Sort) {
        this.sortChange.emit(event);
    }

    onPageEvent(event: PageEvent) {
        this.pageChange.emit(event);
    }

    toggleRow(row: T): void {
        const rowId = row.id;
        if (this.selectedRow()?.id === rowId) {
            this.selectedRow.set(null);
            return;
        }

        this.selectedRow.set(row);
    }
}
