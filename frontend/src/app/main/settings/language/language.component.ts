import { Component, computed, signal } from '@angular/core';
import { LanguageSettings } from '../../../shared/constants/settings/LanguageSettings';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'app-language',
    imports: [
        CommonModule,
        FormsModule,
        MatDividerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatExpansionModule,
    ],
    templateUrl: './language.component.html',
    styleUrl: './language.component.css',
})
export class LanguageComponent {
    private readonly defaultSettings: LanguageSettings = {
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
    };
    protected readonly languages = [
        { value: 'en', label: 'English' },
        { value: 'hu', label: 'Hungarian' },
    ];

    protected readonly dateFormats = [
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ];
    language = signal<LanguageSettings>(this.getSavedSettings());
    private initialSettings = signal<LanguageSettings>(this.language());

    hasChanges = computed((): boolean => {
        return JSON.stringify(this.language()) !== JSON.stringify(this.initialSettings());
    });

    getSavedSettings(): LanguageSettings {
        const saved = localStorage.getItem('language');
        return saved ? JSON.parse(saved) : { ...this.defaultSettings };
    }

    updateSetting<K extends keyof LanguageSettings>(key: K, value: LanguageSettings[K]) {
        this.language.update((current) => ({
            ...current,
            [key]: value,
        }));
    }

    saveSettings(): void {
        const settings = this.language();

        localStorage.setItem('language', JSON.stringify(settings));
        this.initialSettings.set({ ...settings });
    }

    resetToDefaults(): void {
        this.language.set({ ...this.defaultSettings });
        this.saveSettings();
    }
}
