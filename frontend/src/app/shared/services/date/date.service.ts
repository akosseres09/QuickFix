import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DateService {
    toLocaleISOString(date: Date): string {
        const copy = new Date(date);
        copy.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return copy.toISOString();
    }
}
