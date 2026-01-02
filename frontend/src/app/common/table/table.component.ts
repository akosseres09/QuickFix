import {
    Component,
    inject,
    OnInit,
    model,
    input,
    output,
    signal,
    effect,
    computed,
    viewChild,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../shared/services/user/user.service';
import { ADMIN, SYS_ADMIN, User } from '../../shared/model/User';
import { BaseModel } from '../../shared/model/BaseModel';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UrlService } from '../../shared/services/url/url.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-table',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        DatePipe,
        MatSort,
        MatSortHeader,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinner,
    ],
    templateUrl: './table.component.html',
    styleUrl: './table.component.css',
})
export class TableComponent<T extends BaseModel> implements OnInit {
    dataSource = model<MatTableDataSource<T>>(new MatTableDataSource<T>([]));
    displayedColumns = input<Array<DisplayedColumn>>([]);

    showActions = input<boolean>(true);
    showEditAction = input<boolean>(true);
    showDeleteAction = input<boolean>(true);
    tableHeader = input<string>('');
    isLoading = input<boolean>(false);

    edit = output<T>();
    delete = output<T>();
    name = output<T>();

    private readonly userService = inject(UserService);
    private readonly urlService = inject(UrlService);
    private readonly activeRoute = inject(ActivatedRoute);

    user = signal<User | null>(this.userService.getUser());

    columnIds = computed<Array<String>>(() => {
        const ids = this.displayedColumns().map((col) => col.id);
        if (this.showActions() && this.canModify()) {
            ids.push('actions');
        }
        return ids;
    });

    paginator = viewChild(MatPaginator);
    sort = viewChild(MatSort);

    protected initialSortActive = signal<string>('');
    protected initialSortDirection = signal<'asc' | 'desc'>('asc');
    protected pageIndex = signal<number>(0);
    protected pageSize = signal<number>(10);
    protected readonly pageSizes = [5, 10, 20, 30, 50];

    private sortSubscription: Subscription | null = null;

    constructor() {
        effect(() => {
            const ds = this.dataSource();
            const p = this.paginator();
            const s = this.sort();

            if (p) {
                ds.paginator = p;
            }
            if (s) {
                ds.sort = s;
            }
        });

        effect((onCleanup) => {
            const s = this.sort();
            if (s) {
                this.sortSubscription = s.sortChange.subscribe(
                    () => (this.paginator()!.pageIndex = 0)
                );
            }
            onCleanup(() => {
                this.sortSubscription?.unsubscribe();
            });
        });
    }

    ngOnInit(): void {
        const pageSizeParam = this.activeRoute.snapshot.queryParamMap.get('pageSize');
        const pageParam = this.activeRoute.snapshot.queryParamMap.get('page');
        const sortParam = this.activeRoute.snapshot.queryParamMap.get('sort');

        if (sortParam) {
            const isAsc = !sortParam.startsWith('-');
            this.initialSortActive.set(isAsc ? sortParam : sortParam.substring(1));
            this.initialSortDirection.set(isAsc ? 'asc' : 'desc');
        }

        if (pageSizeParam) {
            if (this.pageSizes.indexOf(+pageSizeParam) === -1) {
                this.pageSize.set(10);
                this.urlService.addQueryParams({ pageSize: this.pageSize() });
            } else {
                this.pageSize.set(+pageSizeParam);
            }
        }

        if (pageParam) {
            this.pageIndex.set(+pageParam - 1);
        }
    }

    onSortChange(event: Sort) {
        if (event.direction === '') {
            this.urlService.removeQueryParams(['sort']);
            return;
        }

        const direction = event.direction === 'asc' ? '' : '-';
        this.urlService.addQueryParams({
            sort: `${direction}${event.active}`,
        });
    }

    displayedColumnIds(): Array<String> {
        const ids = this.displayedColumns().map((col) => col.id);
        if (this.showActions() && this.canModify()) {
            ids.push('actions');
        }
        return ids;
    }

    onPageEvent(event: PageEvent) {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.urlService.addQueryParams({ page: this.pageIndex() + 1, pageSize: this.pageSize() });
    }

    onEdit(element: T): void {
        this.edit.emit(element);
    }

    onDelete(element: T): void {
        this.delete.emit(element);
    }

    onNameClick(element: T): void {
        this.name.emit(element);
    }

    canModify() {
        return this.user()?.role === ADMIN || this.user()?.role === SYS_ADMIN;
    }
}
