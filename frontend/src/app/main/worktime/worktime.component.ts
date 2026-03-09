import {
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    OnInit,
    signal,
    viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { Worktime } from '../../shared/model/Worktime';
import { Project } from '../../shared/model/Project';
import { DateRangeComponent } from '../../common/date-range/date-range.component';
import { TableComponent } from '../../common/table/table.component';
import { WorktimeDialogComponent } from './worktime-dialog/worktime-dialog.component';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { DateService } from '../../shared/services/date/date.service';
import { WorktimeService } from '../../shared/services/worktime/worktime.service';
import { ProjectService } from '../../shared/services/project/project.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { debounceTime, filter, switchMap, EMPTY } from 'rxjs';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { ListStateService } from '../../shared/services/list-state/list-state.service';
import { ListState } from '../../shared/constants/table/ListState';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { DateRangeService } from '../../shared/services/date-range/date-range.service';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';

@Component({
    selector: 'app-worktime',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        DateRangeComponent,
        MatIcon,
        MatButton,
        TableComponent,
        WorktimeDialogComponent,
        MatInput,
        MatAutocomplete,
        MatAutocompleteTrigger,
        SpeedDialComponent,
    ],
    templateUrl: './worktime.component.html',
    styleUrl: './worktime.component.css',
})
export class WorktimeComponent implements OnInit {
    private readonly dateService = inject(DateService);
    private readonly worktimeService = inject(WorktimeService);
    private readonly projectService = inject(ProjectService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);
    private readonly listStateService = inject(ListStateService);
    private readonly dateRangeService = inject(DateRangeService);
    private readonly displayedColumnService = inject(DisplayedColumnService);

    private readonly loadListTrigger$ = new Subject<void>();
    readonly organizationId = input.required<string>();

    minDate = signal<Date>(new Date('2026-01-01'));
    maxDate = signal<Date>(new Date(new Date().setHours(23, 59, 59, 999)));
    startDate = this.dateRangeService.startDate;
    endDate = this.dateRangeService.endDate;

    projects = signal<Project[]>([]);
    selectedProjectId = signal<string | null>(null);
    filteredEntries = signal<Worktime[]>([]);

    selectedWorktime = signal<Worktime | null>(null);

    isLoading = signal<boolean>(false);

    shownWorktimes = computed(() => new MatTableDataSource(this.filteredEntries()));
    displayedColumns: DisplayedColumn<Worktime>[] =
        this.displayedColumnService.getWorktimeColumns();

    worktimeDialog = viewChild(WorktimeDialogComponent);
    speedDial = viewChild<SpeedDialComponent>('speedDial');
    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedWorktime();

        return [
            {
                iconName: 'add',
                label: 'Add Worktime',
                shown: !!this.selectedProjectId() && !selected,
                onClick: () => this.openWorktimeDialog(),
            },
            {
                iconName: 'edit',
                label: 'Edit Worktime',
                shown: !!selected,
                onClick: () => this.openWorktimeDialog(),
            },
            {
                iconName: 'delete',
                label: 'Delete Worktime',
                shown: !!selected,
                onClick: () => {},
            },
        ];
    });

    form = this.fb.group({
        projectName: [''],
    });

    listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
        expand: 'issue',
    });

    ngOnInit() {
        this.dateRangeService.init(this.activeRoute, {
            minDate: this.minDate(),
            maxDate: this.maxDate(),
        });

        this.loadListTrigger$
            .pipe(
                debounceTime(50),
                switchMap(() => {
                    const orgId = this.organizationId();
                    if (!orgId) return EMPTY;

                    const start = this.dateService.toLocaleISOString(this.startDate(), true);
                    const end = this.dateService.toLocaleISOString(this.endDate(), true);

                    const projectId = this.selectedProjectId();
                    const queryParams: ApiQueryParams = {
                        start_date: start,
                        end_date: end,
                        ...this.listState.buildQueryParams(),
                    };
                    if (projectId) {
                        queryParams['project_id'] = projectId;
                    }

                    this.listState.isLoading.set(true);
                    return this.worktimeService.getWorktime(orgId, queryParams);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (worktime) => {
                    this.filteredEntries.set(worktime.items);
                    this.listState.totalCount.set(worktime._meta.totalCount);
                    this.listState.isLoading.set(false);
                },
                error: () => {
                    this.snackbarService.error('Failed to load worktime entries.');
                    this.listState.isLoading.set(false);
                },
            });

        this.form
            .get('projectName')
            ?.valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((value) => typeof value === 'string'),
                debounceTime(300)
            )
            .subscribe((value) => {
                this.loadProjects({ name: value });
                if (this.selectedProjectId()) {
                    this.selectedProjectId.set(null);
                    this.filteredEntries.set([]);
                    this.loadWorktime();
                }
            });

        this.loadWorktime();
    }

    // used by autocomplete to show project name instead of id
    displayFn(project: Project | string | null): string {
        if (!project) return '';
        if (typeof project === 'object' && 'name' in project) {
            return project.name;
        }
        return project as string;
    }

    onRowChange(worktime: Worktime | null) {
        if (!worktime) {
            this.selectedWorktime.set(null);
            this.speedDial()?.close();
            return;
        }

        this.selectedWorktime.set(worktime);

        if (worktime && this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    onSortChange(event: Sort): void {
        this.listState.onSortChange(event, () => this.loadWorktime());
    }

    onPageChange(event: PageEvent): void {
        this.listState.onPageChange(event, () => this.loadWorktime());
    }

    onProjectChange(projectId: string): void {
        this.selectedProjectId.set(projectId);
        this.filteredEntries.set([]);
        this.loadWorktime();
    }

    loadWorktime(): void {
        this.loadListTrigger$.next();
    }

    onDateRangeChange($event: { startDate: string; endDate: string }) {
        this.dateRangeService.onDateRangeChange($event, this.activeRoute, () =>
            this.loadWorktime()
        );
    }

    deleteEntry(id: string): void {
        const orgId = this.organizationId();
        if (!orgId) return;

        this.worktimeService.deleteWorktime(orgId, id).subscribe({
            next: () => {
                this.snackbarService.success('Worktime entry deleted.');
                this.loadWorktime();
            },
            error: () => this.snackbarService.error('Failed to delete entry.'),
        });
    }

    openWorktimeDialog(): void {
        if (!this.selectedProjectId() && !this.selectedWorktime()) {
            this.snackbarService.error('Please select a project first.');
            return;
        }
        this.worktimeDialog()?.open();
    }

    onWorktimeSaved(worktime: Worktime): void {
        const obj = {
            dateToCheck: worktime.loggedAt,
            startDate: this.startDate(),
            endDate: this.endDate(),
        };
        if (!this.dateService.isBetweenDates(obj)) return;

        this.loadWorktime();
    }

    onWorktimeEdited(worktime: Worktime) {
        this.filteredEntries.update((entries) =>
            entries.map((entry) => (entry.id === worktime.id ? worktime : entry))
        );

        this.onRowChange(null);
    }

    private loadProjects(qp: ApiQueryParams): void {
        const orgId = this.organizationId();
        if (!orgId) return;

        this.projectService.getProjectsSimple(orgId, qp).subscribe({
            next: (projects) => {
                this.projects.set(projects);
            },
            error: () => {
                this.snackbarService.error('Failed to load projects.');
            },
        });
    }
}
