import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { IssueStats } from '../../../shared/constants/api/IssueStats';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-overview',
    imports: [CommonModule, BaseChartDirective, MatProgressSpinnerModule],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit {
    private readonly issueService = inject(IssueService);

    projectId = input.required<string>();
    organizationId = input.required<string>();

    stats = signal<IssueStats | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

    // Chart configurations (initialized with empty data, populated after fetch)
    statusChartType: ChartType = 'doughnut';
    statusChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    statusChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'right' },
        },
    };

    priorityChartType: ChartType = 'bar';
    priorityChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    priorityChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
        },
    };

    ngOnInit(): void {
        Chart.register(...registerables);

        this.fetchStats();
    }

    private fetchStats(): void {
        this.loading.set(true);
        this.error.set(null);

        const projectId = this.projectId();
        const organizationId = this.organizationId();

        if (!projectId || !organizationId) {
            this.error.set('Project ID or Organization ID is missing.');
            this.loading.set(false);
            return;
        }

        this.issueService
            .getStats({
                projectId,
                organizationId,
            })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => {
                    this.stats.set(data);
                    this.buildCharts(data);
                },
                error: () => {
                    this.error.set('Failed to load issue statistics.');
                },
            });
    }

    private buildCharts(data: IssueStats): void {
        // Status distribution doughnut
        this.statusChartData = {
            labels: ['Open', 'In Progress', 'Review', 'Resolved', 'Closed'],
            datasets: [
                {
                    data: [
                        data.totals.open,
                        data.totals.inProgress,
                        data.totals.inReview,
                        data.totals.resolved,
                        data.totals.closed,
                    ],
                    backgroundColor: [
                        '#0ea5e9', // sky-500
                        '#6366f1', // indigo-500
                        '#d946ef', // fuchsia-500
                        '#14b8a6', // teal-500
                        '#f97316', // orange-500
                    ],
                    borderWidth: 0,
                },
            ],
        };

        // Priority distribution bar
        this.priorityChartData = {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [
                {
                    data: [
                        data.priorities.low,
                        data.priorities.medium,
                        data.priorities.high,
                        data.priorities.critical,
                    ],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)', // green-500
                        'rgba(234, 179, 8, 0.8)', // yellow-500
                        'rgba(249, 115, 22, 0.8)', // orange-500
                        'rgba(239, 68, 68, 0.8)', // red-500
                    ],
                    borderColor: ['#22c55e', '#eab308', '#f97316', '#ef4444'],
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };
    }

    /** Compute percentage for type breakdown bars */
    typePercentage(count: number): number {
        const total = this.stats()?.totals.total ?? 0;
        return total > 0 ? Math.round((count / total) * 100) : 0;
    }
}
