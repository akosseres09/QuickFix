import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppearanceSettings } from '../../../shared/constants/AppearanceSettings';

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
        MatSliderModule,
    ],
    templateUrl: './appearance.component.html',
    styleUrl: './appearance.component.css',
})
export class AppearanceComponent implements OnInit {
    private themeService = inject(ThemeService);
    theme = this.themeService.getTheme();
    private initialTheme = this.theme;
    appearance: AppearanceSettings = {
        fontSize: 14,
        compactMode: false,
        animationsEnabled: true,
    };
    private initialAppearance: AppearanceSettings = { ...this.appearance };

    ngOnInit(): void {
        const savedAppearance = localStorage.getItem('appearance');
        if (savedAppearance) {
            const parsed = JSON.parse(savedAppearance);
            this.appearance = { ...this.appearance, ...parsed };
        }
        this.initialTheme = this.theme;
        this.initialAppearance = { ...this.appearance };
    }

    get hasChanges(): boolean {
        return (
            this.theme !== this.initialTheme ||
            JSON.stringify(this.appearance) !== JSON.stringify(this.initialAppearance)
        );
    }

    onThemeChange(theme: 'light' | 'dark'): void {
        this.theme = theme;
        this.themeService.setTheme(theme);
    }

    saveAppearanceSettings(): void {
        localStorage.setItem('appearance', JSON.stringify(this.appearance));
        this.initialTheme = this.theme;
        this.initialAppearance = { ...this.appearance };
    }

    resetToDefaults(): void {
        this.appearance = {
            fontSize: 14,
            compactMode: false,
            animationsEnabled: true,
        };

        this.saveAppearanceSettings();
    }
}
