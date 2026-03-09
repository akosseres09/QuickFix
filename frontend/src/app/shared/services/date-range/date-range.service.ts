import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DateService } from '../date/date.service';

@Injectable({
    providedIn: 'root',
})
export class DateRangeService {
    private readonly router = inject(Router);
    private readonly dateService = inject(DateService);

    private minDate = signal<Date | undefined>(undefined);
    private maxDate = signal<Date | undefined>(undefined);

    startDate = signal<Date>(this.lastWeek());
    endDate = signal<Date>(new Date());

    /**
     * Call once in ngOnInit to configure bounds and resolve initial dates from the URL.
     */
    init(activeRoute: ActivatedRoute, options?: { minDate?: Date; maxDate?: Date }): void {
        this.minDate.set(options?.minDate);
        this.maxDate.set(options?.maxDate);
        this.startDate.set(this.resolveStartDate(activeRoute));
        this.endDate.set(this.resolveEndDate(activeRoute));
    }

    onDateRangeChange(
        event: { startDate: string; endDate: string },
        activeRoute: ActivatedRoute,
        callback?: () => void
    ): void {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        this.startDate.set(start);
        this.endDate.set(end);

        this.router.navigate([], {
            relativeTo: activeRoute,
            queryParams: {
                startDate: this.dateService.toLocaleISOString(start, true),
                endDate: this.dateService.toLocaleISOString(end, true),
            },
            queryParamsHandling: 'merge',
        });

        callback?.();
    }

    lastWeek(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    }

    private resolveStartDate(activeRoute: ActivatedRoute): Date {
        const startQuery = activeRoute.snapshot.queryParams['startDate'];
        const min = this.minDate();
        if (startQuery) {
            const sd = new Date(startQuery);
            if (!isNaN(sd.getTime()) && (!min || sd >= min)) return sd;
        }
        return this.lastWeek();
    }

    private resolveEndDate(activeRoute: ActivatedRoute): Date {
        const endQuery = activeRoute.snapshot.queryParams['endDate'];
        const max = this.maxDate();
        if (endQuery) {
            const ed = new Date(endQuery);
            if (!isNaN(ed.getTime()) && (!max || ed <= max)) return ed;
        }
        const now = new Date();
        return max && now > max ? max : now;
    }
}
