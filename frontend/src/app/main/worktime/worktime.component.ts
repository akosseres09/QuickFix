import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WorktimeEntry } from '../../shared/model/Worktime';
import { DateRangeComponent } from '../../common/date-range/date-range.component';
import { BarChartComponent } from '../../common/bar-chart/bar-chart.component';
import { LineChartComponent } from '../../common/line-chart/line-chart.component';
import { MatIcon } from '@angular/material/icon';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import { Stat } from '../../shared/constants/Stat';

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
        TableComponent,
    ],
    templateUrl: './worktime.component.html',
    styleUrl: './worktime.component.css',
})
export class WorktimeComponent implements OnInit {
    startDate: Date | null = null;
    endDate: Date | null = null;
    isLoading = true;
    days: Map<string, number> = new Map();
    shownWorktimes = new MatTableDataSource<WorktimeEntry>();
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
            value: (e: WorktimeEntry) => e.date,
        },
        {
            id: 'hours',
            label: 'Hours',
            sortable: true,
            value: (e: WorktimeEntry) => e.hours,
        },
    ];

    stats: Map<string, Stat> = new Map<string, Stat>([
        [
            'totalHours',
            { label: 'Total Hours', value: 0, icon: 'schedule', bgColor: 'bg-blue-500' },
        ],
        [
            'totalEntries',
            { label: 'Total Entries', value: 0, icon: 'assignment', bgColor: 'bg-purple-500' },
        ],
        [
            'averageHoursPerDay',
            { label: 'Avg Hours/Day', value: 0, icon: 'bar_chart', bgColor: 'bg-green-500' },
        ],
        [
            'mostProductiveDay',
            { label: 'Most Productive Day', value: '', icon: 'star', bgColor: 'bg-yellow-500' },
        ],
    ]);

    worktimeEntries: WorktimeEntry[] = [
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

    filteredEntries: WorktimeEntry[] = [];

    ngOnInit() {
        this.filterEntriesByDate();
    }

    deleteEntry(id: number) {
        this.worktimeEntries = this.worktimeEntries.filter((e) => e.id !== id);
        this.filterEntriesByDate();
    }

    filterEntriesByDate() {
        this.isLoading = true;
        if (!this.startDate || !this.endDate) {
            this.filteredEntries = [...this.worktimeEntries];
        } else {
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            this.filteredEntries = this.worktimeEntries.filter((entry) => {
                const entryDate = new Date(entry.date);
                return entryDate >= start && entryDate <= end;
            });
        }
        this.getDaysFromFilteredData();
        this.updateStats();
        this.shownWorktimes.data = this.worktimeEntries;
        this.isLoading = false;
    }

    getDaysFromFilteredData() {
        const dayHours = new Map<string, number>();
        this.filteredEntries.forEach((entry) => {
            dayHours.set(entry.date, (dayHours.get(entry.date) || 0) + entry.hours);
        });
        this.days = dayHours;
    }

    onDateRangeChange($event: { startDate: Date; endDate: Date }) {
        this.startDate = $event.startDate;
        this.endDate = $event.endDate;
        this.filterEntriesByDate();
    }

    updateStats() {
        const totalHoursStat = this.stats.get('totalHours');
        const totalEntriesStat = this.stats.get('totalEntries');
        const averageHoursPerDayStat = this.stats.get('averageHoursPerDay');
        const mostProductiveDayStat = this.stats.get('mostProductiveDay');

        if (totalHoursStat) {
            totalHoursStat.value = this.filteredEntries.reduce(
                (sum, entry) => sum + entry.hours,
                0
            );
        }

        if (totalEntriesStat) {
            totalEntriesStat.value = this.filteredEntries.length;
        }

        if (averageHoursPerDayStat && totalHoursStat) {
            const daysWorked = new Set(this.filteredEntries.map((e) => e.date)).size;
            averageHoursPerDayStat.value =
                daysWorked > 0 ? (totalHoursStat.value as number) / daysWorked : 0;
        }

        if (mostProductiveDayStat) {
            const dayHours = new Map<string, number>();
            this.filteredEntries.forEach((entry) => {
                dayHours.set(entry.date, (dayHours.get(entry.date) || 0) + entry.hours);
            });

            let maxHours = 0;
            let maxDay = '';
            dayHours.forEach((hours, day) => {
                if (hours > maxHours) {
                    maxHours = hours;
                    maxDay = day;
                }
            });

            mostProductiveDayStat.value = maxDay ? new Date(maxDay).toLocaleDateString() : 'N/A';
        }
    }
}
