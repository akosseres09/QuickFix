import { CommonModule } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { scaleUp, scrollAnimation, staggerAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';
import { fromEvent, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-feature',
    imports: [CommonModule],
    templateUrl: './feature.component.html',
    styleUrl: './feature.component.css',
    animations: [scaleUp, staggerAnimation, scrollAnimation],
})
export class FeatureComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly scrollService = inject(ScrollService);
    animationState = signal<'hidden' | 'visible'>('hidden');
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

    constructor() {
        afterNextRender(() => {
            this.updateScrollState();

            fromEvent(window, 'scroll')
                .pipe(throttleTime(20), takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                    this.updateScrollState();
                });
        });
    }

    updateScrollState() {
        this.animationState.set(this.scrollService.checkScroll('feature'));
    }
}
