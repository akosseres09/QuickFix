import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'relativeTime',
})
export class RelativeTimePipe implements PipeTransform {
    transform(value: string | Date | number): string {
        if (!value) return '';

        const date = new Date(value);
        const now = new Date();

        // Calculate the difference in milliseconds
        const elapsed = date.getTime() - now.getTime();

        // Create the native formatter (you can change 'en' to a dynamic locale if needed)
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

        // Convert milliseconds to various units
        const seconds = Math.round(elapsed / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        const months = Math.round(days / 30);
        const years = Math.round(days / 365);

        // Determine the most appropriate unit to display
        if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
        if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
        if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
        if (Math.abs(days) < 30) return rtf.format(days, 'day');
        if (Math.abs(months) < 12) return rtf.format(months, 'month');

        return rtf.format(years, 'year');
    }
}
