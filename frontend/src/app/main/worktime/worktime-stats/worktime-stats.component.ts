import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorktimeService, WorktimeStats } from '../../../shared/services/worktime/worktime.service';
import { Stat } from '../../../shared/constants/Stat';
import { LineChartComponent } from '../../../common/line-chart/line-chart.component';
import { BarChartComponent } from '../../../common/bar-chart/bar-chart.component';
import { DateService } from '../../../shared/services/date/date.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ActivatedRoute } from '@angular/router';
import { DateRangeComponent } from '../../../common/date-range/date-range.component';
import { DateRangeService } from '../../../shared/services/date-range/date-range.service';
import { Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-worktime-stats',
    imports: [
        CommonModule,
        MatIcon,
        MatProgressSpinnerModule,
        LineChartComponent,
        BarChartComponent,
        DateRangeComponent,
    ],
    templateUrl: './worktime-stats.component.html',
})
export class WorktimeStatsComponent implements OnInit {
    private readonly dateService = inject(DateService);
    private readonly worktimeService = inject(WorktimeService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly dateRangeService = inject(DateRangeService);
    private readonly destroyRef = inject(DestroyRef);
    private loadStats$ = new Subject<void>();

    organizationId = input.required<string>();

    minDate = signal<Date>(new Date('2026-01-01'));
    maxDate = signal<Date>(new Date(new Date().setHours(23, 59, 59, 999)));
    startDate = this.dateRangeService.startDate;
    endDate = this.dateRangeService.endDate;
    stats = signal<WorktimeStats | null>(null);
    isLoading = input<boolean>(false);

    days = computed(() => {
        const dayHours = new Map<string, number>();
        const start = this.startDate();
        const end = this.endDate();

        if (start && end) {
            for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                dayHours.set(this.dateService.toLocaleISOString(dt, true), 0);
            }
        }

        const statsData = this.stats();
        if (statsData?.hoursPerDay) {
            statsData.hoursPerDay.forEach(({ date, hours }) => {
                dayHours.set(date, hours);
            });
        }

        return dayHours;
    });

    statCards = computed<Map<string, Stat>>(() => {
        const s = this.stats();

        return new Map<string, Stat>([
            [
                'totalHours',
                {
                    label: 'Total Hours',
                    value: s?.totalHours ?? 0,
                    icon: 'schedule',
                    bgColor: 'bg-blue-500',
                },
            ],
            [
                'totalEntries',
                {
                    label: 'Total Entries',
                    value: s?.totalEntries ?? 0,
                    icon: 'assignment',
                    bgColor: 'bg-purple-500',
                },
            ],
            [
                'averageHoursPerDay',
                {
                    label: 'Avg Hours/Day',
                    value: s?.avgHoursPerDay ?? 0,
                    icon: 'bar_chart',
                    bgColor: 'bg-green-500',
                },
            ],
            [
                'mostProductiveDay',
                {
                    label: 'Most Productive Day',
                    value: s?.mostProductiveDay
                        ? new Date(s.mostProductiveDay.date + 'T00:00:00').toLocaleDateString()
                        : 'N/A',
                    icon: 'star',
                    bgColor: 'bg-yellow-500',
                },
            ],
        ]);
    });

    ngOnInit(): void {
        this.dateRangeService.init(this.activeRoute, {
            minDate: this.minDate(),
            maxDate: this.maxDate(),
        });

        this.loadStats$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => {
                    const qp = {
                        start_date: this.dateService.toLocaleISOString(this.startDate(), true),
                        end_date: this.dateService.toLocaleISOString(this.endDate(), true),
                    };

                    return this.worktimeService.getStats(this.organizationId(), qp);
                })
            )
            .subscribe({
                next: (stats) => {
                    this.stats.set(stats);
                },
                error: (error) => {
                    console.error(error);
                    this.snackbarService.error('Failed to load statistics!');
                },
            });

        this.loadStats();
    }

    getStatValue(valueName: string): string | number {
        const value = this.statCards().get(valueName)?.value;
        if (typeof value === 'number' && value % 1 !== 0) {
            return value.toFixed(2);
        }
        return value ?? '';
    }

    onDateRangeChange($event: { startDate: string; endDate: string }) {
        this.dateRangeService.onDateRangeChange($event, this.activeRoute, () => this.loadStats());
    }

    private loadStats() {
        this.loadStats$.next();
    }
}
