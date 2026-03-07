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
import { BarChartComponent } from '../../common/bar-chart/bar-chart.component';
import { LineChartComponent } from '../../common/line-chart/line-chart.component';
import { TableComponent } from '../../common/table/table.component';
import { WorktimeDialogComponent } from './worktime-dialog/worktime-dialog.component';
import { Stat } from '../../shared/constants/Stat';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { DateService } from '../../shared/services/date/date.service';
import { WorktimeService } from '../../shared/services/worktime/worktime.service';
import { ProjectService } from '../../shared/services/project/project.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { debounceTime, filter, switchMap, EMPTY } from 'rxjs';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';

@Component({
    selector: 'app-worktime',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        DateRangeComponent,
        BarChartComponent,
        LineChartComponent,
        MatIcon,
        MatButton,
        TableComponent,
        WorktimeDialogComponent,
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
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);

    private readonly queryParams = toSignal(this.route.queryParams);
    readonly organizationId = input.required<string>();

    minDate = signal<Date>(new Date('2026-01-01'));
    maxDate = signal<Date>(new Date(new Date().setHours(23, 59, 59, 999)));
    startDate = signal<Date>(this.getStartDate());
    endDate = signal<Date>(this.getEndDate());

    projects = signal<Project[]>([]);
    selectedProjectId = signal<string | null>(null);

    isLoading = signal<boolean>(false);

    private readonly loadTrigger$ = new Subject<void>();

    filteredEntries = signal<Worktime[]>([]);

    shownWorktimes = computed(() => new MatTableDataSource(this.filteredEntries()));

    days = computed(() => {
        const dayHours = new Map<string, number>();
        const start = this.startDate();
        const end = this.endDate();
        const entries = this.filteredEntries();

        if (start && end) {
            for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                dayHours.set(this.dateService.toLocaleISOString(dt, true), 0);
            }
        }

        entries.forEach((entry) => {
            const hours = entry.minutesSpent / 60;
            dayHours.set(entry.loggedAt, (dayHours.get(entry.loggedAt) ?? 0) + hours);
        });

        return dayHours;
    });

    stats = computed(() => {
        const entries = this.filteredEntries();
        const totalHours = entries.reduce((sum, e) => sum + e.minutesSpent / 60, 0);
        const totalEntries = entries.length;

        const daysWorked = new Set(entries.map((e) => e.loggedAt)).size;
        const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0;

        const dayMap = new Map<string, number>();
        entries.forEach((e) => {
            const h = e.minutesSpent / 60;
            dayMap.set(e.loggedAt, (dayMap.get(e.loggedAt) ?? 0) + h);
        });
        let maxHours = 0;
        let maxDay = '';
        dayMap.forEach((val, key) => {
            if (val > maxHours) {
                maxHours = val;
                maxDay = key;
            }
        });

        return new Map<string, Stat>([
            [
                'totalHours',
                {
                    label: 'Total Hours',
                    value: totalHours,
                    icon: 'schedule',
                    bgColor: 'bg-blue-500',
                },
            ],
            [
                'totalEntries',
                {
                    label: 'Total Entries',
                    value: totalEntries,
                    icon: 'assignment',
                    bgColor: 'bg-purple-500',
                },
            ],
            [
                'averageHoursPerDay',
                {
                    label: 'Avg Hours/Day',
                    value: avgHours,
                    icon: 'bar_chart',
                    bgColor: 'bg-green-500',
                },
            ],
            [
                'mostProductiveDay',
                {
                    label: 'Most Productive Day',
                    value: maxDay ? new Date(maxDay + 'T00:00:00').toLocaleDateString() : 'N/A',
                    icon: 'star',
                    bgColor: 'bg-yellow-500',
                },
            ],
        ]);
    });

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

    ngOnInit() {
        this.loadTrigger$
            .pipe(
                debounceTime(50),
                switchMap(() => {
                    const orgId = this.organizationId();
                    if (!orgId) return EMPTY;

                    const start = this.dateService.toLocaleISOString(this.startDate(), true);
                    const end = this.dateService.toLocaleISOString(this.endDate(), true);

                    const projectId = this.selectedProjectId();
                    const queryParams: Record<string, string | number | undefined> = {
                        start_date: start,
                        end_date: end,
                        pageSize: 200,
                    };
                    if (projectId) {
                        queryParams['project_id'] = projectId;
                    }

                    this.isLoading.set(true);
                    return this.worktimeService.getWorktime(orgId, queryParams);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (response) => {
                    this.filteredEntries.set(response.items);
                    this.isLoading.set(false);
                },
                error: () => {
                    this.snackbarService.error('Failed to load worktime entries.');
                    this.isLoading.set(false);
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

    onProjectChange(projectId: string): void {
        this.selectedProjectId.set(projectId);
        this.filteredEntries.set([]);
        this.loadWorktime();
    }

    loadWorktime(): void {
        this.loadTrigger$.next();
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
            relativeTo: this.route,
            queryParams: {
                startDate: this.dateService.toLocaleISOString(start, true),
                endDate: this.dateService.toLocaleISOString(end, true),
            },
            queryParamsHandling: 'merge',
        });

        this.loadWorktime();
    }

    deleteEntry(id: string): void {
        const orgId = this.organizationId();
        if (!orgId) return;

        this.worktimeService.deleteWorktime(orgId, id).subscribe({
            next: () => {
                this.filteredEntries.update((entries) => entries.filter((e) => e.id !== id));
                this.snackbarService.success('Worktime entry deleted.');
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
        const start = this.dateService.toLocaleISOString(this.startDate(), true);
        const end = this.dateService.toLocaleISOString(this.endDate(), true);
        if (worktime.loggedAt <= start || worktime.loggedAt >= end) return;

        this.filteredEntries.update((entries) => [worktime, ...entries]);
    }

    getStatValue(valueName: string): string | number {
        const value = this.stats().get(valueName)?.value;
        if (typeof value === 'number' && value % 1 !== 0) {
            return value.toFixed(2);
        }
        return value ?? '';
    }
}
