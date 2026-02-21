import { CommonModule } from '@angular/common';
import { Component, computed, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppearanceSettings } from '../../../shared/constants/settings/AppearanceSettings';

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
export class AppearanceComponent {
    private themeService = inject(ThemeService);
    theme = model<'light' | 'dark'>(this.themeService.getTheme());
    private initialTheme = signal<'light' | 'dark'>(this.theme());
    defaultAppearanceSettings: AppearanceSettings = {
        fontSize: 14,
        compactMode: false,
        animationsEnabled: true,
    };
    appearance = signal<AppearanceSettings>(this.getSavedSettings());
    private initialAppearance = signal<AppearanceSettings>(this.appearance());

    hasChanges = computed((): boolean => {
        return JSON.stringify(this.appearance()) !== JSON.stringify(this.initialAppearance());
    });

    onThemeChange(theme: 'light' | 'dark'): void {
        this.theme.set(theme);
        this.themeService.setTheme(theme);
    }

    getSavedSettings(): AppearanceSettings {
        const saved = localStorage.getItem('appearance');
        return saved ? JSON.parse(saved) : this.defaultAppearanceSettings;
    }

    updateSettings<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) {
        this.appearance.update((current) => ({
            ...current,
            [key]: value,
        }));
    }

    saveAppearanceSettings(): void {
        localStorage.setItem('appearance', JSON.stringify(this.appearance()));
        this.initialTheme.set(this.theme());
        this.initialAppearance.set(this.appearance());
    }

    resetToDefaults(): void {
        this.appearance.set({ ...this.defaultAppearanceSettings });
        this.saveAppearanceSettings();
    }
}
