import {
    Component,
    computed,
    contentChild,
    input,
    model,
    output,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Sort, SortDirection } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseModel } from '../../shared/model/BaseModel';
import { ListItemDirective } from './list-item.directive';

export interface SortableColumn {
    id: string;
    label: string;
}

@Component({
    selector: 'app-list',
    imports: [
        CommonModule,
        MatPaginatorModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinner,
        MatTooltipModule,
    ],
    templateUrl: './list.component.html',
    styleUrl: './list.component.css',
})
export class ListComponent<T extends BaseModel> {
    data = input<T[]>([]);
    sortableColumns = input<SortableColumn[]>([]);

    listHeader = input<string>('');
    isLoading = input<boolean>(false);

    initialPageSize = input<number>(20);
    initialPageIndex = input<number>(0);
    initialSortActive = input<string>('');
    initialSortDirection = input<SortDirection>('asc');
    totalCount = input<number>(0);
    enablePagination = input<boolean>(true);
    disableSelection = input<boolean | ((row: T) => boolean)>(false);

    sortChange = output<Sort>();
    pageChange = output<PageEvent>();

    selectedRow = model<T | null>(null);

    itemTemplate = contentChild(ListItemDirective, { read: TemplateRef });
    paginator = viewChild(MatPaginator);

    protected readonly pageSizes = [5, 10, 20, 30, 50];

    // Internal sort state, initialized from inputs
    protected sortActive = signal<string>('');
    protected sortDirection = signal<SortDirection>('');

    private sortInitialized = false;

    private ensureSortInitialized(): void {
        if (this.sortInitialized) return;
        this.sortInitialized = true;
        this.sortActive.set(this.initialSortActive());
        this.sortDirection.set(this.initialSortDirection() || 'asc');
    }

    onSortFieldChange(columnId: string): void {
        this.ensureSortInitialized();
        this.sortActive.set(columnId);
        if (!this.sortDirection() || this.sortDirection() === '') {
            this.sortDirection.set('asc');
        }
        this.emitSortChange();
    }

    onSortDirectionToggle(): void {
        this.ensureSortInitialized();
        this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        this.emitSortChange();
    }

    onClearSort(): void {
        this.sortActive.set('');
        this.sortDirection.set('');
        this.sortChange.emit({ active: '', direction: '' });
        const p = this.paginator();
        if (p) p.pageIndex = 0;
    }

    private emitSortChange(): void {
        this.sortChange.emit({
            active: this.sortActive(),
            direction: this.sortDirection(),
        });
        const p = this.paginator();
        if (p) p.pageIndex = 0;
    }

    onPageEvent(event: PageEvent): void {
        if (!this.enablePagination()) return;
        this.pageChange.emit(event);
    }

    toggleRow(row: T): void {
        if (this.isRowDisabled(row)) return;

        if (this.selectedRow()?.id === row.id) {
            this.selectedRow.set(null);
            return;
        }

        this.selectedRow.set(row);
    }

    isRowDisabled(row: T): boolean {
        const disabled = this.disableSelection();
        if (typeof disabled === 'function') {
            return disabled(row);
        }
        return disabled;
    }
}
