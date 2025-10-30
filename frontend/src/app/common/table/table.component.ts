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
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { CommonModule, DatePipe } from '@angular/common';
import { Issue } from '../../shared/model/Issue';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../shared/services/user/user.service';
import { ADMIN, SYS_ADMIN, User } from '../../shared/model/User';

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
    ],
    templateUrl: './table.component.html',
    styleUrl: './table.component.css',
})
export class TableComponent implements OnChanges, AfterViewInit {
    @Input() dataSource: MatTableDataSource<Issue> = new MatTableDataSource();
    @Input() displayedColumns: Array<DisplayedColumn> = [];
    @Input() showActions: boolean = true;

    @Output() editClick = new EventEmitter<Issue>();
    @Output() deleteClick = new EventEmitter<Issue>();

    userService = inject(UserService);
    user: User | null = this.userService.getUser();
    columnIds: Array<String> = this.displayedColumnIds();

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.dataSource = changes['dataSource'].currentValue;
        this.displayedColumns = changes['displayedColumns'].currentValue;
        this.columnIds = this.displayedColumnIds();
    }

    displayedColumnIds(): Array<String> {
        const ids = this.displayedColumns.map((col) => col.id);
        if (this.showActions && this.canModify()) {
            ids.push('actions');
        }
        return ids;
    }

    onEdit(element: Issue): void {
        this.editClick.emit(element);
    }

    onDelete(element: Issue): void {
        this.deleteClick.emit(element);
    }

    canModify() {
        return this.user?.role === ADMIN || this.user?.role === SYS_ADMIN;
    }
}
