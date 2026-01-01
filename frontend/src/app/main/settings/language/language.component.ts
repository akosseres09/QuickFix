import { Component, OnInit } from '@angular/core';
import { LanguageSettings } from '../../../shared/constants/LanguageSettings';
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
export class LanguageComponent implements OnInit {
    language: LanguageSettings = {
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
    };
    private initialLanguage: LanguageSettings = { ...this.language };

    protected readonly languages = [
        { value: 'en', label: 'English' },
        { value: 'hu', label: 'Hungarian' },
    ];

    protected readonly dateFormats = [
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ];

    ngOnInit(): void {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            this.language = JSON.parse(savedLanguage);
        }
        this.initialLanguage = { ...this.language };
    }

    get hasChanges(): boolean {
        return JSON.stringify(this.language) !== JSON.stringify(this.initialLanguage);
    }

    saveSettings(): void {
        localStorage.setItem('language', JSON.stringify(this.language));
        this.initialLanguage = { ...this.language };
    }

    resetToDefaults(): void {
        this.language = {
            language: 'en',
            dateFormat: 'MM/DD/YYYY',
        };
        this.saveSettings();
    }
}
