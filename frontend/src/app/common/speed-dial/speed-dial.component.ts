import { Component, computed, input, output, signal } from '@angular/core';
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

    togglerClick = output<void>();

    /**
     * Toggles the speed dial open/closed state if there are any buttons.
     * Emits togglerClick event if no buttons provided.
     */
    onTogglerClick(): void {
        if (this.buttons.length === 0) {
            this.togglerClick.emit();
            return;
        }

        this.dialState.set(this.isDialOpen() ? 'closed' : 'open');
    }
}
