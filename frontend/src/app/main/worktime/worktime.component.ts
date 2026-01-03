import {
    Component,
    computed,
    inject,
    OnDestroy,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { WorktimeEntry } from '../../shared/model/Worktime';
import { DateRangeComponent } from '../../common/date-range/date-range.component';
import { BarChartComponent } from '../../common/bar-chart/bar-chart.component';
import { LineChartComponent } from '../../common/line-chart/line-chart.component';
import { TableComponent } from '../../common/table/table.component';
import { WorktimeDialogComponent } from './worktime-dialog/worktime-dialog.component';
import { Stat } from '../../shared/constants/Stat';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { DialogService } from '../../shared/services/dialog/dialog.service';
import { DateService } from '../../shared/services/date/date.service';

const MOCK_DATA: WorktimeEntry[] = [
    {
        id: 1,
        issue: 'Fix login bug',
        issueId: 1234,
        date: '2025-12-28',
        hours: 4,
        description: 'Fixed authentication issue',
        user: 'John Doe',
    },
    {
        id: 2,
        issue: 'Update dashboard UI',
        issueId: 1235,
        date: '2025-12-28',
        hours: 6,
        description: 'Redesigned dashboard layout',
        user: 'John Doe',
    },
    {
        id: 3,
        issue: 'API integration',
        issueId: 1236,
        date: '2025-12-27',
        hours: 8,
        description: 'Integrated payment gateway',
        user: 'John Doe',
    },
    {
        id: 4,
        issue: 'Database optimization',
        issueId: 1237,
        date: '2025-12-27',
        hours: 5,
        description: 'Optimized slow queries',
        user: 'Jane Smith',
    },
    {
        id: 5,
        issue: 'Mobile responsive fixes',
        issueId: 1238,
        date: '2025-12-26',
        hours: 3,
        description: 'Fixed mobile layout issues',
        user: 'John Doe',
    },
    {
        id: 6,
        issue: 'Security audit',
        issueId: 1239,
        date: '2025-12-26',
        hours: 7,
        description: 'Performed security review',
        user: 'Jane Smith',
    },
    {
        id: 7,
        issue: 'Documentation update',
        issueId: 1240,
        date: '2025-12-25',
        hours: 2,
        description: 'Updated API documentation',
        user: 'John Doe',
    },
    {
        id: 8,
        issue: 'Code review',
        issueId: 1241,
        date: '2025-12-24',
        hours: 4,
        description: 'Reviewed pull requests',
        user: 'Jane Smith',
    },
];

@Component({
    selector: 'app-worktime',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DateRangeComponent,
        BarChartComponent,
        LineChartComponent,
        MatIcon,
        MatButton,
        TableComponent,
        WorktimeDialogComponent,
    ],
    templateUrl: './worktime.component.html',
    styleUrl: './worktime.component.css',
})
export class WorktimeComponent implements OnDestroy {
    private readonly dialogService = inject(DialogService);
    private readonly dateService = inject(DateService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    private readonly queryParams = toSignal(this.route.queryParams);

    minDate = signal<Date>(new Date('2025-01-01'));
    maxDate = signal<Date>(new Date(new Date().setHours(23, 59, 59, 999)));

    startDate = computed(() => this.getStartDate());
    endDate = computed(() => this.getEndDate());

    worktimeEntries = signal<WorktimeEntry[]>(MOCK_DATA);
    isLoading = signal<boolean>(false);

    filteredEntries = computed(() => {
        const startStr = this.startDate();
        const endStr = this.endDate();
        const entries = this.worktimeEntries();

        if (!startStr || !endStr) {
            return entries;
        }

        const start = new Date(startStr);
        const end = new Date(endStr);

        return entries.filter((entry) => {
            const entryDate = this.dateService.toLocaleISODate(new Date(entry.date), true);
            return entryDate >= start && entryDate <= end;
        });
    });

    shownWorktimes = computed(() => new MatTableDataSource(this.filteredEntries()));

    days = computed(() => {
        const dayHours = new Map<string, number>();
        const startStr = this.startDate();
        const endStr = this.endDate();
        const entries = this.filteredEntries();

        if (startStr && endStr) {
            const start = new Date(startStr);
            const end = new Date(endStr);
            for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                const dateStr = this.dateService.toLocaleISOString(dt, true);
                dayHours.set(dateStr, 0);
            }
        }

        entries.forEach((entry) => {
            dayHours.set(entry.date, (dayHours.get(entry.date) || 0) + entry.hours);
        });

        return dayHours;
    });

    stats = computed(() => {
        const entries = this.filteredEntries();
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        const totalEntries = entries.length;

        const daysWorked = new Set(entries.map((e) => e.date)).size;
        const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0;

        const dayMap = new Map<string, number>();
        entries.forEach((e) => dayMap.set(e.date, (dayMap.get(e.date) || 0) + e.hours));
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
                    value: maxDay ? new Date(maxDay).toLocaleDateString() : 'N/A',
                    icon: 'star',
                    bgColor: 'bg-yellow-500',
                },
            ],
        ]);
    });

    issueIds = computed(() => {
        const ids = new Set(this.worktimeEntries().map((e) => e.issueId));
        return Array.from(ids).sort((a, b) => a - b);
    });

    displayedColumns: DisplayedColumn[] = [
        {
            id: 'issueId',
            label: '#',
            sortable: false,
            value: (e: WorktimeEntry) => `#${e.issueId}`,
        },
        {
            id: 'issue',
            label: 'Issue',
            sortable: false,
            value: (e: WorktimeEntry) => e.issue,
            link: true,
        },
        {
            id: 'date',
            label: 'Date',
            sortable: true,
            value: (e: WorktimeEntry) => this.dateService.toLocaleISOString(new Date(e.date), true),
        },
        { id: 'hours', label: 'Hours', sortable: true, value: (e: WorktimeEntry) => e.hours },
    ];

    worktimeDialog = viewChild(WorktimeDialogComponent);
    private dialogRefSub: Subscription | null = null;

    ngOnDestroy(): void {
        this.dialogRefSub?.unsubscribe();
    }

    getStartDate(): Date {
        const startQuery = this.queryParams()?.['startDate'];
        if (startQuery) {
            const sd = new Date(startQuery);
            if (sd >= this.minDate()) {
                return sd;
            }
        }

        return this.getLastWeek();
    }

    getEndDate(): Date {
        const endQuery = this.queryParams()?.['endDate'];
        const max = this.maxDate();

        if (endQuery) {
            const ed = new Date(endQuery);
            if (ed <= max) {
                return ed;
            }
        }

        const now = new Date();
        return now > max ? max : now;
    }

    getLastWeek(): Date {
        const date = new Date();
        if (date) {
            date.setDate(date.getDate() - 7);
        }
        return date;
    }

    onDateRangeChange($event: { startDate: string; endDate: string }) {
        const start = this.dateService.toLocaleISOString(new Date($event.startDate), true);
        const end = this.dateService.toLocaleISOString(new Date($event.endDate), true);

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { startDate: start, endDate: end },
            queryParamsHandling: 'merge',
        });
    }

    deleteEntry(id: number) {
        this.worktimeEntries.update((entries) => entries.filter((e) => e.id !== id));
    }

    openWorktimeDialog() {
        const dialog = this.worktimeDialog();
        if (!dialog?.worktimeFormTemplate) return;

        const dialogRef = this.dialogService.openFormDialog(
            'Add Worktime',
            dialog.worktimeFormTemplate() as TemplateRef<any>,
            {
                saveLabel: 'Save',
                cancelLabel: 'Cancel',
                saveDisabled: dialog.worktimeForm.invalid,
                width: '600px',
            }
        );

        const statusSub = dialog.worktimeForm.statusChanges.subscribe(() => {
            if (dialogRef.componentInstance) {
                dialogRef.componentInstance.data.saveDisabled = dialog.worktimeForm.invalid;
            }
        });

        this.dialogRefSub = dialogRef.afterClosed().subscribe((result) => {
            statusSub.unsubscribe();
            if (result && result.action === 'save') {
                const formValue = dialog.worktimeForm.value;
                const newEntry: WorktimeEntry = {
                    id: Math.max(...this.worktimeEntries().map((e) => e.id), 0) + 1,
                    issueId: parseInt(formValue.issueId as string),
                    issue: formValue.issue as string,
                    date: new Date(formValue.date).toISOString(),
                    hours: parseFloat(formValue.hours),
                    description: formValue.description || '',
                    user: 'Current User',
                };

                this.worktimeEntries.update((entries) => [newEntry, ...entries]);
            }
            dialog.worktimeForm.reset({ date: new Date() });
        });
    }

    getStatValue(valueName: string) {
        const value = this.stats().get(valueName)?.value;
        if (typeof value === 'number' && value % 1 !== 0) {
            return value.toFixed(2);
        }
        return value;
    }
}
