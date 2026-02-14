import { Component, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../shared/model/User';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-avatar',
    imports: [CommonModule, MatIcon, RouterLink],
    template: `
        @if (user().profilePictureUrl) {
            <a [routerLink]="'/users/@' + user().username">
                <img
                    [src]="user().profilePictureUrl"
                    [alt]="user().username || 'User avatar'"
                    [class]="avatarClasses"
                    class="rounded-full object-cover"
                />
            </a>
        } @else {
            <div
                [class]="avatarClasses"
                class="rounded-full bg-gray-300 flex items-center justify-center"
            >
                <mat-icon [class]="iconSizeClass">person</mat-icon>
            </div>
        }
    `,
    styles: [],
})
export class AvatarComponent {
    user = input.required<User>();
    size = input<'sm' | 'md' | 'lg'>('md');

    get avatarClasses(): string {
        const sizeMap = {
            sm: 'w-6 h-6',
            md: 'w-8 h-8',
            lg: 'w-12 h-12',
        };
        return sizeMap[this.size()];
    }

    get iconSizeClass(): string {
        const iconSizeMap = {
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-xl',
        };
        return iconSizeMap[this.size()];
    }
}
