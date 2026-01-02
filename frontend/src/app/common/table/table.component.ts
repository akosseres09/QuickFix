import {
    AfterViewInit,
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    Output,
    EventEmitter,
    inject,
    OnInit,
    OnDestroy,
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
export class TableComponent<T extends BaseModel>
    implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
    @Input() dataSource: MatTableDataSource<T> = new MatTableDataSource();
    @Input() displayedColumns: Array<DisplayedColumn> = [];
    @Input() showActions: boolean = true;
    @Input() showEditAction: boolean = true;
    @Input() showDeleteAction: boolean = true;
    @Input() tableHeader = '';
    @Input() isLoading: boolean = false;

    @Output() edit = new EventEmitter<T>();
    @Output() delete = new EventEmitter<T>();
    @Output() name = new EventEmitter<T>();

    userService = inject(UserService);
    user: User | null = this.userService.getUser();
    columnIds: Array<String> = this.displayedColumnIds();

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    protected initialSortActive: string = '';
    protected initialSortDirection: 'asc' | 'desc' = 'asc';
    protected pageIndex: number = 0;
    protected pageSize: number = 10;
    protected readonly pageSizes = [5, 10, 20, 30, 50];
    private readonly urlService = inject(UrlService);
    private readonly activeRoute = inject(ActivatedRoute);
    private sortSubscription: Subscription | null = null;

    ngOnInit(): void {
        const pageSizeParam = this.activeRoute.snapshot.queryParamMap.get('pageSize');
        const pageParam = this.activeRoute.snapshot.queryParamMap.get('page');
        const sortParam = this.activeRoute.snapshot.queryParamMap.get('sort');

        if (sortParam) {
            const isAsc = !sortParam.startsWith('-');
            this.initialSortActive = isAsc ? sortParam : sortParam.substring(1);
            this.initialSortDirection = isAsc ? 'asc' : 'desc';
        }

        if (pageSizeParam) {
            if (this.pageSizes.indexOf(+pageSizeParam) === -1) {
                this.pageSize = 10;
                this.urlService.addQueryParams({ pageSize: this.pageSize });
            } else {
                this.pageSize = +pageSizeParam;
            }
        }

        if (pageParam) {
            this.pageIndex = +pageParam - 1;
        }

        this.columnIds = this.displayedColumnIds();
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.sortSubscription = this.sort.sortChange.subscribe(
            () => (this.paginator.pageIndex = 0)
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dataSource']) {
            this.dataSource = changes['dataSource'].currentValue;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        }
        if (changes['displayedColumns']) {
            this.displayedColumns = changes['displayedColumns'].currentValue;
            this.columnIds = this.displayedColumnIds();
        }
        if (changes['isLoading']) {
            this.isLoading = changes['isLoading'].currentValue;
        }
    }

    ngOnDestroy(): void {
        this.sortSubscription?.unsubscribe();
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
        const ids = this.displayedColumns.map((col) => col.id);
        if (this.showActions && this.canModify()) {
            ids.push('actions');
        }
        return ids;
    }

    onPageEvent(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;

        this.urlService.addQueryParams({ page: this.pageIndex + 1, pageSize: this.pageSize });
    }

    onEdit(element: T): void {
        this.edit.emit(element);
    }

    onDelete(element: T): void {
        this.delete.emit(element);
    }

    canModify() {
        return this.user?.role === ADMIN || this.user?.role === SYS_ADMIN;
    }

    onNameClick(element: T): void {
        this.name.emit(element);
    }
}
