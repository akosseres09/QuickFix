import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fadeInRight, scrollAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';

@Component({
    selector: 'app-end',
    imports: [RouterLink],
    templateUrl: './end.component.html',
    styleUrl: './end.component.css',
    animations: [fadeInRight, scrollAnimation],
})
export class EndComponent implements OnInit {
    animationState: 'hidden' | 'visible' = 'hidden';
    scrollService = inject(ScrollService);

    ngOnInit(): void {
        this.animationState = this.scrollService.checkScroll('end');
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.animationState = this.scrollService.checkScroll('end');
    }
}
