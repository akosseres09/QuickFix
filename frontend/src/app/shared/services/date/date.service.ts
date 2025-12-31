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
    toLocaleISOString(date: Date): string {
        const copy = new Date(date);
        copy.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return copy.toISOString();
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
