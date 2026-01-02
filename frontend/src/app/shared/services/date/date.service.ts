import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DateService {
    /**
     * @param date The date to convert to a locale ISO string
     *
     * Returns a locale ISO string representation of the given date.
     */
    toLocaleISOString(date: Date, truncate = false): string {
        const copy = new Date(date);
        copy.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return truncate ? copy.toISOString().split('T')[0] : copy.toISOString();
    }

    /**
     *
     * @param date The date to convert to a locale ISO date
     * @param truncate If true, truncates the time portion
     * Returns a Date object representing the date portion of the given date in locale ISO format.
     */
    toLocaleISODate(date: Date, truncate = false): Date {
        const isoString = this.toLocaleISOString(date);
        return new Date(truncate ? isoString.split('T')[0] : isoString);
    }

    /**
     * @param urlDate The date string to parse into a Date object
     *
     * Returns a Date object parsed from the given date string.
     * If the string is invalid, returns the current date.
     */
    parseDate(urlDate: any): Date {
        const date = Date.parse(urlDate);
        if (isNaN(date)) {
            return new Date();
        }
        return new Date(date);
    }
}
