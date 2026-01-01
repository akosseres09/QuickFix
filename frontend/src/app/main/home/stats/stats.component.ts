import { Component, HostListener, inject, OnInit } from '@angular/core';
import { fadeInLeft, scrollAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';

@Component({
    selector: 'app-stats',
    imports: [],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.css',
    animations: [fadeInLeft, scrollAnimation],
})
export class StatsComponent implements OnInit {
    animationState: 'hidden' | 'visible' = 'hidden';
    scrollService = inject(ScrollService);

    ngOnInit(): void {
        this.animationState = this.scrollService.checkScroll('stats');
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.animationState = this.scrollService.checkScroll('stats');
    }
}
