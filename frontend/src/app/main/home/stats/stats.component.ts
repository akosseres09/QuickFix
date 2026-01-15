import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { fadeInLeft, scrollAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';
import { fromEvent, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-stats',
    imports: [],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.css',
    animations: [fadeInLeft, scrollAnimation],
})
export class StatsComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly scrollService = inject(ScrollService);
    animationState = signal<'hidden' | 'visible'>('hidden');

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
        this.animationState.set(this.scrollService.checkScroll('stats'));
    }
}
