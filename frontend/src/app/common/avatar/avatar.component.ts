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
                    [class]="avatarClasses + ' ' + styleClass()"
                    class=" object-cover"
                />
            </a>
        } @else {
            <div
                [class]="avatarClasses + ' ' + styleClass()"
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
    size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
    styleClass = input<string>('');

    get avatarClasses(): string {
        const sizeMap = {
            sm: 'w-6 h-6',
            md: 'w-8 h-8',
            lg: 'w-12 h-12',
            xl: 'w-16 h-16',
        };
        return sizeMap[this.size()];
    }

    get iconSizeClass(): string {
        const iconSizeMap = {
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-xl',
            xl: 'text-2xl',
        };
        return iconSizeMap[this.size()];
    }
}
