import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { PrivacySettings } from '../../../shared/constants/settings/PrivacySettings';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatSlideToggleModule,
        MatDividerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatExpansionModule,
        MatSliderModule,
    ],
    templateUrl: './privacy.component.html',
    styleUrl: './privacy.component.css',
})
export class PrivacyComponent {
    private readonly defaultSettings: PrivacySettings = {
        profileVisibility: 'team',
        showEmail: false,
        showActivity: true,
        dataCollection: true,
    };

    privacy = signal<PrivacySettings>(this.getSavedSettings());
    private initialPrivacy = signal<PrivacySettings>(this.privacy());
    protected readonly visibilityOptions = [
        { value: 'public', label: 'Public' },
        { value: 'team', label: 'Team Only' },
        { value: 'private', label: 'Private' },
    ];

    hasChanges = computed(() => {
        return JSON.stringify(this.privacy()) !== JSON.stringify(this.initialPrivacy());
    });

    private getSavedSettings(): PrivacySettings {
        const saved = localStorage.getItem('privacy');
        return saved ? JSON.parse(saved) : { ...this.defaultSettings };
    }

    updateSetting<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) {
        this.privacy.update((current) => ({
            ...current,
            [key]: value,
        }));
    }

    savePrivacySettings(): void {
        const settings = this.privacy();
        localStorage.setItem('privacy', JSON.stringify(settings));
        this.initialPrivacy.set(settings);
    }

    resetToDefaults(): void {
        this.privacy.set({ ...this.defaultSettings });
        this.savePrivacySettings();
    }
}
