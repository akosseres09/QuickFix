import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorktimeStats } from '../../../shared/services/worktime/worktime.service';
import { Stat } from '../../../shared/constants/Stat';
import { LineChartComponent } from '../../../common/line-chart/line-chart.component';
import { BarChartComponent } from '../../../common/bar-chart/bar-chart.component';
import { Worktime } from '../../../shared/model/Worktime';
import { DateService } from '../../../shared/services/date/date.service';

@Component({
    selector: 'app-worktime-stats',
    imports: [
        CommonModule,
        MatIcon,
        MatProgressSpinnerModule,
        LineChartComponent,
        BarChartComponent,
    ],
    templateUrl: './worktime-stats.component.html',
})
export class WorktimeStatsComponent {
    private readonly dateService = inject(DateService);

    startDate = input.required<Date>();
    endDate = input.required<Date>();
    filteredEntries = input.required<Worktime[]>();
    stats = input.required<WorktimeStats | null>();
    isLoading = input<boolean>(false);

    days = computed(() => {
        const dayHours = new Map<string, number>();
        const start = this.startDate();
        const end = this.endDate();

        console.log(start);
        console.log(end);

        if (start && end) {
            for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                dayHours.set(this.dateService.toLocaleISOString(dt, true), 0);
            }
        }

        const statsData = this.stats();
        console.log(statsData);

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

    getStatValue(valueName: string): string | number {
        const value = this.statCards().get(valueName)?.value;
        if (typeof value === 'number' && value % 1 !== 0) {
            return value.toFixed(2);
        }
        return value ?? '';
    }
}
