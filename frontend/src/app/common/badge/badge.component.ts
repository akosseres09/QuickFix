import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-badge',
    imports: [MatIcon],
    templateUrl: './badge.component.html',
    styleUrl: './badge.component.css',
})
export class BadgeComponent {
    color = input<string>('');
    tailwindColor = input<string>('');
    text = input.required<string>();
    roundNess = input<'sm' | 'md' | 'lg' | 'xl' | 'full' | 'none'>('full');
    textSize = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('sm');
    fontWeight = input<'normal' | 'medium' | 'semibold' | 'bold'>('medium');
    icon = input<string | null>(null);

    get badgeClasses() {
        const roundedClasses: Record<string, string> = {
            sm: 'rounded-sm',
            md: 'rounded-md',
            lg: 'rounded-lg',
            xl: 'rounded-xl',
            full: 'rounded-full',
            none: 'rounded-none',
        };

        const textClasses: Record<string, string> = {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
        };

        const weightClasses: Record<string, string> = {
            normal: 'font-normal',
            medium: 'font-medium',
            semibold: 'font-semibold',
            bold: 'font-bold',
        };

        let classes = [
            'border-2',
            'px-3',
            'py-1',
            roundedClasses[this.roundNess()],
            textClasses[this.textSize()],
            weightClasses[this.fontWeight()],
        ];

        if (this.tailwindColor()) {
            classes.push(this.tailwindColor());
        }

        return classes.join(' ');
    }

    get lightBackgroundColor() {
        const hexColor = this.color();
        if (!hexColor) return null;

        let hex = hexColor.replace('#', '');

        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
}
