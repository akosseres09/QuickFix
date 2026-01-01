import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fadeInUp, scrollAnimation } from '../../../shared/utils/animations';
import { ScrollService } from '../../../shared/services/scroll/scroll.service';

@Component({
    selector: 'app-hero',
    imports: [CommonModule, RouterLink],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.css',
    animations: [fadeInUp, scrollAnimation],
})
export class HeroComponent implements OnInit {
    animationState: 'hidden' | 'visible' = 'hidden';
    benefits = [
        { icon: '✅', text: 'Free 14-day trial' },
        { icon: '🔒', text: 'Bank-level security' },
        { icon: '📱', text: 'Mobile responsive' },
        { icon: '🌐', text: 'Cloud-based platform' },
    ];
    private scrollService = inject(ScrollService);

    ngOnInit(): void {
        this.animationState = this.scrollService.checkScroll('hero');
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.animationState = this.scrollService.checkScroll('hero');
    }
}
