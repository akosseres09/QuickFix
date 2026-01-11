import { Component, computed, input, signal } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SpeedDialButton } from '../../shared/constants/SpeedDialButton';
import {
    speedDialStaggerAnimation,
    speedDialTogglerAnimation,
} from '../../shared/utils/animations';

@Component({
    selector: 'app-speed-dial',
    imports: [MatFabButton, MatIcon],
    templateUrl: './speed-dial.component.html',
    styleUrl: './speed-dial.component.css',
    animations: [speedDialTogglerAnimation, speedDialStaggerAnimation],
})
export class SpeedDialComponent {
    protected mainIconName = input<string>('add');
    protected buttons = input<SpeedDialButton[]>([]);
    protected dialState = signal<'open' | 'closed'>('closed');
    protected shownButtons = computed(() => (this.isDialOpen() ? this.buttons() : []));
    private isDialOpen = computed(() => this.dialState() === 'open');

    onTogglerClick(): void {
        this.dialState.set(this.isDialOpen() ? 'closed' : 'open');
    }
}
