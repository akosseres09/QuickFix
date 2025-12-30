import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { WorktimeEntry } from '../../shared/model/Worktime';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-line-chart',
    imports: [BaseChartDirective, CommonModule, MatProgressSpinner],
    templateUrl: './line-chart.component.html',
    styleUrl: './line-chart.component.css',
})
export class LineChartComponent implements OnInit, OnChanges {
    @Input() data: WorktimeEntry[] = [];
    @Input() daysMap: Map<string, number> = new Map();
    @Input() isLoading: boolean = true;
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
    private days: string[] = [];

    public lineChartType: ChartType = 'line';
    public lineChartData: ChartConfiguration['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Cumulative Hours',
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };
    public lineChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Cumulative Hours Over Time' },
        },
        scales: {
            y: { beginAtZero: true },
        },
    };

    ngOnInit(): void {
        Chart.register(...registerables);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.data = changes['data'].currentValue;
        }

        if (changes['daysMap']) {
            this.daysMap = changes['daysMap'].currentValue;
        }

        if (changes['isLoading']) {
            this.isLoading = changes['isLoading'].currentValue;
        }

        this.updateChartData();
    }

    updateChartData(): void {
        const sortedDays = Array.from(this.daysMap.keys()).sort();

        let cumulative = 0;
        const cumulativeData: number[] = [];
        sortedDays.forEach((day) => {
            cumulative += this.daysMap.get(day) || 0;
            cumulativeData.push(cumulative);
        });

        this.lineChartData.labels = sortedDays.map((day) =>
            new Date(day).toLocaleDateString('en', { month: 'short', day: 'numeric' })
        );
        this.lineChartData.datasets[0].data = cumulativeData;
        this.chart?.chart?.update();
    }
}
