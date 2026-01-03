import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { FeatureComponent } from './feature/feature.component';
import { StatsComponent } from './stats/stats.component';
import { EndComponent } from './end/end.component';
import { fadeInUp } from '../../shared/utils/animations';

@Component({
    selector: 'app-home',
    imports: [CommonModule, HeroComponent, FeatureComponent, StatsComponent, EndComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    animations: [fadeInUp],
})
export class HomeComponent {}
