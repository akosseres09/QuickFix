import { Component, computed, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { AppearanceComponent } from './appearance/appearance.component';
import { NotificationComponent } from './notification/notification.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { LanguageComponent } from './language/language.component';

@Component({
    selector: 'app-settings',
    imports: [
        MatButtonModule,
        MatIconModule,
        AppearanceComponent,
        NotificationComponent,
        PrivacyComponent,
        LanguageComponent,
    ],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css',
})
export class SettingsComponent {
    private snackbarService = inject(SnackbarService);
    private readonly appearanceComponent = viewChild(AppearanceComponent);
    private readonly notificationComponent = viewChild(NotificationComponent);
    private readonly privacyComponent = viewChild(PrivacyComponent);
    private readonly languageComponent = viewChild(LanguageComponent);

    hasAnyChanges = computed(() => {
        return (this.appearanceComponent()?.hasChanges() ||
            this.notificationComponent()?.hasChanges() ||
            this.privacyComponent()?.hasChanges() ||
            this.languageComponent()?.hasChanges()) as boolean;
    });

    saveAllSettings(): void {
        this.appearanceComponent()?.saveAppearanceSettings();
        this.notificationComponent()?.saveNotifications();
        this.privacyComponent()?.savePrivacySettings();
        this.languageComponent()?.saveSettings();

        this.snackbarService.open('Settings saved successfully!');
    }

    resetAllSettings(): void {
        this.appearanceComponent()?.resetToDefaults();
        this.notificationComponent()?.resetToDefaults();
        this.privacyComponent()?.resetToDefaults();
        this.languageComponent()?.resetToDefaults();

        this.snackbarService.open('Settings reset to defaults!');
    }
}
