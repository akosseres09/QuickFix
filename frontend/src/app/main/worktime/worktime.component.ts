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
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { Worktime } from '../../shared/model/Worktime';
import { Project } from '../../shared/model/Project';
import { DateRangeComponent } from '../../common/date-range/date-range.component';
import { TableComponent } from '../../common/table/table.component';
import { WorktimeDialogComponent } from './worktime-dialog/worktime-dialog.component';
import { WorktimeStatsComponent } from './worktime-stats/worktime-stats.component';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { DateService } from '../../shared/services/date/date.service';
import { WorktimeService, WorktimeStats } from '../../shared/services/worktime/worktime.service';
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
        WorktimeStatsComponent,
        MatInput,
        MatAutocomplete,
        MatAutocompleteTrigger,
    ],
    templateUrl: './worktime.component.html',
    styleUrl: './worktime.component.css',
})
export class WorktimeComponent implements OnInit {
    private readonly dateService = inject(DateService);
    private readonly worktimeService = inject(WorktimeService);
    private readonly projectService = inject(ProjectService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly router = inject(Router);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);
    private readonly listStateService = inject(ListStateService);

    private readonly loadListTrigger$ = new Subject<void>();
    private readonly loadStatsTrigger$ = new Subject<void>();
    private readonly queryParams = toSignal(this.activeRoute.queryParams);
    readonly organizationId = input.required<string>();

    minDate = signal<Date>(new Date('2026-01-01'));
    maxDate = signal<Date>(new Date(new Date().setHours(23, 59, 59, 999)));
    startDate = signal<Date>(this.getStartDate());
    endDate = signal<Date>(this.getEndDate());

    projects = signal<Project[]>([]);
    selectedProjectId = signal<string | null>(null);
    filteredEntries = signal<Worktime[]>([]);
    worktimeStats = signal<WorktimeStats | null>(null);
    isLoading = signal<boolean>(false);

    shownWorktimes = computed(() => new MatTableDataSource(this.filteredEntries()));
    displayedColumns: DisplayedColumn<Worktime>[] = [
        {
            id: 'loggedAt',
            label: 'Date',
            sortable: true,
            value: (e: Worktime) => new Date(e.loggedAt + 'T00:00:00').toLocaleDateString(),
        },
        {
            id: 'minutesSpent',
            label: 'Hours',
            sortable: true,
            value: (e: Worktime) => (e.minutesSpent / 60).toFixed(2),
        },
        {
            id: 'description',
            label: 'Description',
            sortable: false,
            value: (e: Worktime) => e.description,
        },
    ];

    worktimeDialog = viewChild(WorktimeDialogComponent);
    form = this.fb.group({
        projectName: [''],
    });

    listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
    });

    ngOnInit() {
        this.loadListTrigger$
            .pipe(
                debounceTime(50),
                switchMap(() => {
                    const orgId = this.organizationId();
                    if (!orgId) return EMPTY;

                    const start = this.dateService.toLocaleISOString(this.startDate(), true);
                    const end = this.dateService.toLocaleISOString(this.endDate(), true);

                    const projectId = this.selectedProjectId();
                    const queryParams: Record<string, string | number | undefined | null> = {
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

        this.loadStatsTrigger$
            .pipe(
                debounceTime(50),
                switchMap(() => {
                    const orgId = this.organizationId();
                    if (!orgId) return EMPTY;

                    const start = this.dateService.toLocaleISOString(this.startDate(), true);
                    const end = this.dateService.toLocaleISOString(this.endDate(), true);

                    const projectId = this.selectedProjectId();
                    const queryParams: Record<string, string | undefined> = {
                        start_date: start,
                        end_date: end,
                    };
                    if (projectId) {
                        queryParams['project_id'] = projectId;
                    }

                    return this.worktimeService.getStats(orgId, queryParams);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (stats) => this.worktimeStats.set(stats),
                error: () => this.snackbarService.error('Failed to load worktime stats.'),
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
                    this.loadStats();
                }
            });

        this.loadWorktime();
        this.loadStats();
    }

    // used by autocomplete to show project name instead of id
    displayFn(project: Project | string | null): string {
        if (!project) return '';
        if (typeof project === 'object' && 'name' in project) {
            return project.name;
        }
        return project as string;
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
        this.loadStats();
    }

    loadWorktime(): void {
        this.loadListTrigger$.next();
    }

    loadStats(): void {
        this.loadStatsTrigger$.next();
    }

    getStartDate(): Date {
        const startQuery = this.queryParams()?.['startDate'];
        if (startQuery) {
            const sd = new Date(startQuery);
            if (!isNaN(sd.getTime()) && sd >= this.minDate()) return sd;
        }
        return this.getLastWeek();
    }

    getEndDate(): Date {
        const endQuery = this.queryParams()?.['endDate'];
        const max = this.maxDate();
        if (endQuery) {
            const ed = new Date(endQuery);
            if (!isNaN(ed.getTime()) && ed <= max) return ed;
        }
        const now = new Date();
        return now > max ? max : now;
    }

    getLastWeek(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    }

    onDateRangeChange($event: { startDate: string; endDate: string }) {
        const start = new Date($event.startDate);
        const end = new Date($event.endDate);

        this.startDate.set(start);
        this.endDate.set(end);

        this.router.navigate([], {
            relativeTo: this.activeRoute,
            queryParams: {
                startDate: this.dateService.toLocaleISOString(start, true),
                endDate: this.dateService.toLocaleISOString(end, true),
            },
            queryParamsHandling: 'merge',
        });

        this.loadWorktime();
        this.loadStatsTrigger$.next();
    }

    deleteEntry(id: string): void {
        const orgId = this.organizationId();
        if (!orgId) return;

        this.worktimeService.deleteWorktime(orgId, id).subscribe({
            next: () => {
                this.snackbarService.success('Worktime entry deleted.');
                this.loadWorktime();
                this.loadStats();
            },
            error: () => this.snackbarService.error('Failed to delete entry.'),
        });
    }

    openWorktimeDialog(): void {
        if (!this.selectedProjectId()) {
            this.snackbarService.error('Please select a project first.');
            return;
        }
        this.worktimeDialog()?.open();
    }

    onWorktimeSaved(worktime: Worktime): void {
        if (!this.isBetweenDates(worktime.loggedAt)) return;

        this.loadWorktime();
        this.loadStats();
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

    private isBetweenDates(date: string): boolean {
        const start = this.dateService.toLocaleISOString(this.startDate(), true);
        const end = this.dateService.toLocaleISOString(this.endDate(), true);
        return date >= start && date <= end;
    }
}
