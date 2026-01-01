import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { scaleUp, scrollAnimation, staggerAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';

@Component({
    selector: 'app-feature',
    imports: [CommonModule],
    templateUrl: './feature.component.html',
    styleUrl: './feature.component.css',
    animations: [scaleUp, staggerAnimation, scrollAnimation],
})
export class FeatureComponent implements OnInit {
    features = [
        {
            icon: '🎯',
            title: 'Issue Tracking',
            description:
                'Track and manage issues with powerful boards, filters, and real-time updates.',
            color: 'blue',
        },
        {
            icon: '📊',
            title: 'Project Analytics',
            description:
                'Visualize team performance with intuitive dashboards and detailed reports.',
            color: 'purple',
        },
        {
            icon: '⏱️',
            title: 'Time Management',
            description:
                'Log work hours, track project time, and generate comprehensive timesheets.',
            color: 'green',
        },
        {
            icon: '🚀',
            title: 'Fast & Reliable',
            description: 'Built for speed with modern architecture ensuring 99.9% uptime.',
            color: 'orange',
        },
    ];
    animationState: 'hidden' | 'visible' = 'hidden';
    scrollService = inject(ScrollService);

    ngOnInit(): void {
        this.animationState = this.scrollService.checkScroll('feature');
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.animationState = this.scrollService.checkScroll('feature');
    }
}
