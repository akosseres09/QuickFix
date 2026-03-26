import { Component, computed, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { AppearanceComponent } from './appearance/appearance.component';
import { LanguageComponent } from './language/language.component';

@Component({
    selector: 'app-settings',
    imports: [MatButtonModule, MatIconModule, AppearanceComponent, LanguageComponent],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css',
})
export class SettingsComponent {
    private snackbarService = inject(SnackbarService);
    private readonly languageComponent = viewChild(LanguageComponent);

    hasAnyChanges = computed(() => {
        return this.languageComponent()?.hasChanges() as boolean;
    });

    saveAllSettings(): void {
        this.languageComponent()?.saveSettings();

        this.snackbarService.open('Settings saved successfully!');
    }

    resetAllSettings(): void {
        this.languageComponent()?.resetToDefaults();

        this.snackbarService.open('Settings reset to defaults!');
    }
}
