import { Component, computed, input, model, output, signal } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';
import {
    speedDialStaggerAnimation,
    speedDialTogglerAnimation,
} from '../../shared/utils/animations';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-speed-dial',
    imports: [MatFabButton, MatIcon, CommonModule, RouterLink],
    templateUrl: './speed-dial.component.html',
    styleUrl: './speed-dial.component.css',
    animations: [speedDialTogglerAnimation, speedDialStaggerAnimation],
})
export class SpeedDialComponent {
    mainIconName = input<string>('add');
    buttons = input<SpeedDialButton[]>([]);
    protected dialState = signal<'open' | 'closed'>('closed');
    protected shownButtons = computed(() =>
        this.isDialOpen() ? this.buttons().filter((b) => b.shown) : []
    );
    private isDialOpen = computed(() => this.dialState() === 'open');

    togglerClick = output<void>();

    // Data is not important. Sets it to null when dialog is closed so table row is not highlighted.
    selectedRow = model<any>(null);

    /**
     * Toggles the speed dial open/closed state if there are any buttons.
     * Emits togglerClick event if no buttons provided.
     */
    onTogglerClick(): void {
        if (this.buttons().length === 0) {
            this.togglerClick.emit();
            return;
        }

        this.dialState.set(this.isDialOpen() ? 'closed' : 'open');
        if (this.dialState() === 'closed') {
            this.selectedRow.set(null);
        }
    }

    close(): void {
        if (!this.isDialOpen()) return;

        this.dialState.set('closed');
        this.selectedRow.set(null);
    }

    open(): void {
        if (this.isDialOpen()) return;

        this.dialState.set('open');
    }

    getDialState(): 'open' | 'closed' {
        return this.dialState();
    }

    isOpen(): boolean {
        return this.isDialOpen();
    }
}
