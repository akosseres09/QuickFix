import { CommonModule } from '@angular/common';
import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SidebarService } from '../../../shared/services/sidebar/sidebar.service';

@Component({
    selector: 'app-appearance',
    imports: [
        CommonModule,
        FormsModule,
        MatSlideToggleModule,
        MatButtonToggleModule,
        MatDividerModule,
        MatIconModule,
        MatExpansionModule,
    ],
    templateUrl: './appearance.component.html',
    styleUrl: './appearance.component.css',
})
export class AppearanceComponent {
    private themeService = inject(ThemeService);
    private sidebarService = inject(SidebarService);

    theme = model<'light' | 'dark'>(this.themeService.getTheme());
    sidebarOpen = this.sidebarService.isOpen;

    onThemeChange(theme: 'light' | 'dark'): void {
        this.theme.set(theme);
        this.themeService.setTheme(theme);
    }

    onSidebarToggle(open: boolean): void {
        this.sidebarService.set(open);
    }
}
