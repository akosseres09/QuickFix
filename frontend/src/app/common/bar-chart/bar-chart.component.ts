import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { WorktimeEntry } from '../../shared/model/Worktime';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-bar-chart',
    imports: [BaseChartDirective, MatProgressSpinner],
    templateUrl: './bar-chart.component.html',
    styleUrl: './bar-chart.component.css',
})
export class BarChartComponent implements OnInit, OnChanges {
    @Input() data: WorktimeEntry[] = [];
    @Input() isLoading: boolean = true;
    @Input() daysMap: Map<string, number> = new Map();
    private days: string[] = [];
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    public barChartType: ChartType = 'bar';
    public barChartData: ChartConfiguration['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Hours Worked',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Hours Worked per Day' },
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    ngOnInit(): void {
        Chart.register(...registerables);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.data = changes['data'].currentValue;
            this.updateChart();
        }

        if (changes['daysMap']) {
            this.daysMap = changes['daysMap'].currentValue;
        }

        if (changes['isLoading']) {
            this.isLoading = changes['isLoading'].currentValue;
        }

        this.updateChart();
    }

    updateChart(): void {
        const sortedDays = Array.from(this.daysMap.keys()).sort();

        this.barChartData.labels = sortedDays.map((day) =>
            new Date(day).toLocaleDateString('en', { month: 'short', day: 'numeric' })
        );
        this.barChartData.datasets[0].data = sortedDays.map((day) => this.daysMap.get(day) || 0);
        this.chart?.chart?.update();
    }
}
