import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-overview',
    imports: [CommonModule],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.css',
})
export class OverviewComponent {
    // Statistics data
    stats = [
        {
            label: 'Total Issues',
            value: 1247,
            change: '+12%',
            trend: 'up',
            icon: '📊',
        },
        {
            label: 'Open Issues',
            value: 342,
            change: '-8%',
            trend: 'down',
            icon: '🔓',
        },
        {
            label: 'In Progress',
            value: 128,
            change: '+15%',
            trend: 'up',
            icon: '⚡',
        },
        {
            label: 'Resolved',
            value: 777,
            change: '+23%',
            trend: 'up',
            icon: '✅',
        },
    ];

    // Priority distribution
    priorities = [
        { label: 'Critical', count: 45, percentage: 13, color: 'from-red-500 to-red-600' },
        { label: 'High', count: 98, percentage: 29, color: 'from-orange-500 to-orange-600' },
        { label: 'Medium', count: 156, percentage: 46, color: 'from-yellow-500 to-yellow-600' },
        { label: 'Low', count: 43, percentage: 12, color: 'from-green-500 to-green-600' },
    ];

    // Category distribution
    categories = [
        { name: 'Bug', count: 145, icon: '🐛' },
        { name: 'Feature', count: 89, icon: '✨' },
        { name: 'Enhancement', count: 67, icon: '🚀' },
        { name: 'Documentation', count: 41, icon: '📝' },
    ];

    // Team performance
    teamStats = [
        { name: 'Response Time', value: '2.3h', status: 'excellent', icon: '⏱️' },
        { name: 'Resolution Rate', value: '87%', status: 'good', icon: '📈' },
        { name: 'Customer Satisfaction', value: '4.6/5', status: 'excellent', icon: '⭐' },
        { name: 'Avg. Close Time', value: '4.2d', status: 'good', icon: '🎯' },
    ];

    // Recent activity summary
    activitySummary = [
        { action: 'Issues Created', count: 23, time: 'Today' },
        { action: 'Issues Resolved', count: 31, time: 'Today' },
        { action: 'Comments Added', count: 156, time: 'Today' },
        { action: 'Assignments Made', count: 18, time: 'Today' },
    ];
}
