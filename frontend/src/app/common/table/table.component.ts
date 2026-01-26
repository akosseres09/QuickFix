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
    DestroyRef,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseModel } from '../../shared/model/BaseModel';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UrlService } from '../../shared/services/url/url.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Claims } from '../../shared/constants/Claims';
import { AuthService } from '../../shared/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
        RouterLink,
    ],
    templateUrl: './table.component.html',
    styleUrl: './table.component.css',
})
export class TableComponent<T extends BaseModel> implements OnInit {
    dataSource = model<MatTableDataSource<T>>(new MatTableDataSource<T>([]));
    displayedColumns = input<Array<DisplayedColumn<T>>>([]);

    tableHeader = input<string>('');
    isLoading = input<boolean>(false);

    edit = output<T>();
    delete = output<T>();
    name = output<T>();

    private readonly authService = inject(AuthService);
    private readonly urlService = inject(UrlService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    user = signal<Claims | null>(this.authService.currentUserClaims());

    columnIds = computed<Array<String>>(() => {
        return this.displayedColumnIds();
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

        effect(() => {
            const s = this.sort();
            if (s) {
                this.sortSubscription = s.sortChange
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe(() => (this.paginator()!.pageIndex = 0));
            }
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
        return this.displayedColumns().map((col) => col.id);
    }

    onPageEvent(event: PageEvent) {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.urlService.addQueryParams({ page: this.pageIndex() + 1, pageSize: this.pageSize() });
    }

    onNameClick(element: T): void {
        this.name.emit(element);
    }
}
