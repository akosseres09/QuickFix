import { Component, computed, signal } from '@angular/core';
import { NotificationSettings } from '../../../shared/constants/NotificationSettings';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';

@Component({
    selector: 'app-notification',
    imports: [
        CommonModule,
        FormsModule,
        MatSlideToggleModule,
        MatDividerModule,
        MatIconModule,
        MatExpansionModule,
        MatSliderModule,
    ],
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.css',
})
export class NotificationComponent {
    private readonly defaultSettings: NotificationSettings = {
        emailNotifications: true,
        pushNotifications: false,
        taskReminders: true,
        weeklyDigest: false,
        projectUpdates: true,
        mentionAlerts: true,
    };
    notifications = signal<NotificationSettings>(this.getSavedSettings());
    private initialNotifications = signal<NotificationSettings>(this.notifications());

    hasChanges = computed(() => {
        return JSON.stringify(this.notifications()) !== JSON.stringify(this.initialNotifications());
    });

    updateSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
        this.notifications.update((current) => ({
            ...current,
            [key]: value,
        }));
    }

    getSavedSettings(): NotificationSettings {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : { ...this.defaultSettings };
    }

    saveNotifications(): void {
        const settings = this.notifications();
        localStorage.setItem('notifications', JSON.stringify(settings));
        this.initialNotifications.set({ ...settings });
    }

    resetToDefaults(): void {
        this.notifications.set({ ...this.defaultSettings });
        this.saveNotifications();
    }
}
