import { CommonModule } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fadeInUp, scrollAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';
import { fromEvent, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-hero',
    imports: [CommonModule, RouterLink],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.css',
    animations: [fadeInUp, scrollAnimation],
})
export class HeroComponent {
    private readonly scrollService = inject(ScrollService);
    private readonly destroyRef = inject(DestroyRef);

    animationState = signal<'hidden' | 'visible'>('hidden');
    benefits = [
        { icon: '✅', text: 'Free 14-day trial' },
        { icon: '🔒', text: 'Bank-level security' },
        { icon: '📱', text: 'Mobile responsive' },
        { icon: '🌐', text: 'Cloud-based platform' },
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
        this.animationState.set(this.scrollService.checkScroll('hero'));
    }
}
