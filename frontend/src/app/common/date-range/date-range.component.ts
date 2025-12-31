import {
    Component,
    EventEmitter,
    HostListener,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
    MatDatepickerModule,
    MatDateRangeInput,
    MatDateRangePicker,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { UrlService } from '../../shared/services/url/url.service';
import { DateService } from '../../shared/services/date/date.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-date-range',
    imports: [
        MatDatepickerModule,
        MatDateRangeInput,
        MatDateRangePicker,
        MatFormFieldModule,
        MatNativeDateModule,
        ReactiveFormsModule,
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './date-range.component.html',
    styleUrl: './date-range.component.css',
})
export class DateRangeComponent implements OnInit, OnDestroy {
    private readonly currentDate: Date = new Date();
    protected touchUi = window.innerWidth < 768;

    @Input() startDate: Date = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        this.currentDate.getDate() - 7
    );
    @Input() endDate: Date = new Date();
    @Input() minDate: Date = new Date(this.startDate.getFullYear() - 2, 0, 1);
    @Input() maxDate: Date = new Date();
    @Output() dateRangeChange = new EventEmitter<{
        startDate: string;
        endDate: string;
    }>();

    private readonly fb = inject(FormBuilder);
    private readonly urlService = inject(UrlService);
    private readonly dateService = inject(DateService);
    private readonly router = inject(Router);

    private subscription: Subscription | null = null;
    protected range = this.fb.group({
        startDate: this.fb.control<Date>(this.startDate),
        endDate: this.fb.control<Date>(this.endDate),
    });

    ngOnInit(): void {
        const urlStartDate = this.router.routerState.snapshot.root.queryParams['startDate'];
        const urlEndDate = this.router.routerState.snapshot.root.queryParams['endDate'];

        if (urlStartDate) {
            this.startDate = new Date(urlStartDate);
            this.range.get('startDate')?.setValue(this.startDate);
        }
        if (urlEndDate) {
            this.endDate = new Date(urlEndDate);
            this.range.get('endDate')?.setValue(this.endDate);
        }

        this.endDate.setHours(23, 59, 59, 999);
        this.onDateRangChange(this.startDate, this.endDate);

        this.subscription = this.range.valueChanges.subscribe((value) => {
            if (!value.endDate || !value.startDate) {
                return;
            }
            value.endDate.setHours(23, 59, 59, 999);
            this.onDateRangChange(value.startDate, value.endDate);
        });
    }

    /** @param startDate the start date selected from the date-range picker
     *  @param endDate the end date selected from the date-range picker
     *
     * The shown dates are converted to locale ISO strings (localStart, localEnd).
     * The dates used for filtering the db use the full ISO string (with timezone).
     * Emits the dateRangeChange event and updates the URL query parameters accordingly.
     *
     */
    onDateRangChange(startDate: Date, endDate: Date): void {
        if (!startDate || !endDate) return;
        this.startDate = startDate;
        this.endDate = endDate;

        const localStart = this.dateService.toLocaleISOString(startDate);
        const localEnd = this.dateService.toLocaleISOString(endDate);

        this.dateRangeChange.emit({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        const params = {
            startDate: localStart.split('T')[0],
            endDate: localEnd.split('T')[0],
        };

        this.urlService.addQueryParams(params);
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.touchUi = (event.target as Window).innerWidth < 768;
    }
}
