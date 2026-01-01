import { Component, OnInit } from '@angular/core';
import { PrivacySettings } from '../../../shared/constants/PrivacySettings';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';

@Component({
    selector: 'app-privacy',
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
export class PrivacyComponent implements OnInit {
    privacy: PrivacySettings = {
        profileVisibility: 'team',
        showEmail: false,
        showActivity: true,
        dataCollection: true,
    };
    private initialPrivacy: PrivacySettings = { ...this.privacy };
    protected readonly visibilityOptions = [
        { value: 'public', label: 'Public' },
        { value: 'team', label: 'Team Only' },
        { value: 'private', label: 'Private' },
    ];

    ngOnInit(): void {
        const savedPrivacy = localStorage.getItem('privacy');
        if (savedPrivacy) {
            this.privacy = JSON.parse(savedPrivacy);
        }
        this.initialPrivacy = { ...this.privacy };
    }

    get hasChanges(): boolean {
        return JSON.stringify(this.privacy) !== JSON.stringify(this.initialPrivacy);
    }

    savePrivacySettings(): void {
        localStorage.setItem('privacy', JSON.stringify(this.privacy));
        this.initialPrivacy = { ...this.privacy };
    }

    resetToDefaults(): void {
        this.privacy = {
            profileVisibility: 'team',
            showEmail: false,
            showActivity: true,
            dataCollection: true,
        };

        this.savePrivacySettings();
    }
}
