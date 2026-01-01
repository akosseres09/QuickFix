import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { HeroComponent } from './hero/hero.component';
import { FeatureComponent } from './feature/feature.component';
import { StatsComponent } from './stats/stats.component';
import { EndComponent } from './end/end.component';

@Component({
    selector: 'app-home',
    imports: [CommonModule, HeroComponent, FeatureComponent, StatsComponent, EndComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    animations: [
        trigger('fadeInUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(40px)' }),
                animate('700ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
        ]),
    ],
})
export class HomeComponent {}
