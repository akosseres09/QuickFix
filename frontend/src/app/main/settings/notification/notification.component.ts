import { Component, OnInit } from '@angular/core';
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
export class NotificationComponent implements OnInit {
    notifications: NotificationSettings = {
        emailNotifications: true,
        pushNotifications: false,
        taskReminders: true,
        weeklyDigest: false,
        projectUpdates: true,
        mentionAlerts: true,
    };
    private initialNotifications: NotificationSettings = { ...this.notifications };

    ngOnInit(): void {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            this.notifications = JSON.parse(savedNotifications);
        }
        this.initialNotifications = { ...this.notifications };
    }

    get hasChanges(): boolean {
        return JSON.stringify(this.notifications) !== JSON.stringify(this.initialNotifications);
    }

    saveNotifications(): void {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.initialNotifications = { ...this.notifications };
    }

    resetToDefaults(): void {
        this.notifications = {
            emailNotifications: true,
            pushNotifications: false,
            taskReminders: true,
            weeklyDigest: false,
            projectUpdates: true,
            mentionAlerts: true,
        };
        this.saveNotifications();
    }
}
