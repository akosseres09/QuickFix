import {
    Component,
    inject,
    model,
    input,
    output,
    signal,
    effect,
    computed,
    viewChild,
    DestroyRef,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortHeader, Sort, SortDirection } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseModel } from '../../shared/model/BaseModel';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Claims } from '../../shared/constants/Claims';
import { AuthService } from '../../shared/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-table',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSort,
        MatSortHeader,
        MatIconModule,
        MatButtonModule,
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
    selectedRowChange = output<T | null>();

    private readonly authService = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);

    selectedRow = signal<T | null>(null);
    user = signal<Claims | null>(this.authService.currentUserClaims());

    columnIds = computed<Array<String>>(() => {
        return this.displayedColumnIds();
    });

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

    displayedColumnIds(): Array<String> {
        return this.displayedColumns().map((col) => col.id);
    }

    onPageEvent(event: PageEvent) {
        this.pageChange.emit(event);
    }

    onNameClick(element: T): void {
        this.name.emit(element);
    }

    toggleRow(row: T): void {
        const rowId = row.id;
        if (this.selectedRow()?.id === rowId) {
            this.selectedRow.set(null);
            this.selectedRowChange.emit(null);
            return;
        }

        this.selectedRow.set(row);
        this.selectedRowChange.emit(row);
    }
}
