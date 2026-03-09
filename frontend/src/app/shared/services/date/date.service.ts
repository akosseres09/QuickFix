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

    toGMTtime(date: Date): string {
        // Ensure we are working with a valid Date object
        const copy = new Date(date);

        // 1. Format the Date part: "February 19, 2026"
        const dateOptions: Intl.DateTimeFormatOptions = {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        };
        const datePart = new Intl.DateTimeFormat('en-US', dateOptions).format(copy);

        // 2. Format the Time part: "3:29:56 PM GMT+1"
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'shortOffset', // This guarantees the GMT+X format
        };
        const timePart = new Intl.DateTimeFormat('en-US', timeOptions).format(copy);

        // 3. Combine them exactly how you want
        return `${datePart} at ${timePart}`;
    }

    /**
     * @param urlDate The date string to parse into a Date object
     *
     * Returns a Date object parsed from the given date string.
     * If the string is invalid, returns the current date.
     */
    parseDate(urlDate: string): Date {
        const date = Date.parse(urlDate);
        if (isNaN(date)) {
            return new Date();
        }
        return new Date(date);
    }

    /**
     * Returns a Date object parsed from the given timestamp (in seconds).
     * @param timestamp the timestamp to parse, in seconds
     * @returns a Date object representing the given timestamp
     */
    parseTimestamp(timestamp: number): Date {
        return new Date(timestamp * 1000);
    }

    isBetweenDates(dates: {
        dateToCheck: string | Date;
        startDate: string | Date;
        endDate: string | Date;
    }) {
        const start = this.toLocaleISOString(new Date(dates.startDate), true);
        const end = this.toLocaleISOString(new Date(dates.endDate), true);

        const date =
            dates.dateToCheck instanceof Date
                ? this.toLocaleISOString(dates.dateToCheck, true)
                : dates.dateToCheck;

        return date >= start && date <= end;
    }
}
