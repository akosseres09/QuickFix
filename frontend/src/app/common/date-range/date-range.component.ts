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
    readonly currentDate: Date = new Date();
    touchUi = window.innerWidth < 768;
    @Input() startDate: Date = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        this.currentDate.getDate() - 7
    );
    @Input() endDate: Date = new Date();
    @Input() minDate: Date = new Date(this.startDate.getFullYear() - 2, 0, 1);
    @Input() maxDate: Date = new Date();
    @Output() dateRangeChange = new EventEmitter<{
        startDate: Date;
        endDate: Date;
    }>();
    private fb = inject(FormBuilder);

    range = this.fb.group({
        startDate: this.fb.control<Date>(this.startDate),
        endDate: this.fb.control<Date>(this.endDate),
    });
    private subscription: Subscription | null = null;

    ngOnInit(): void {
        this.dateRangeChange.emit({
            startDate: this.range.value.startDate as Date,
            endDate: this.range.value.endDate as Date,
        });
        this.subscription = this.range.valueChanges.subscribe((value) => {
            if (!value.endDate || !value.startDate) {
                return;
            }

            this.dateRangeChange.emit({
                startDate: value.startDate as Date,
                endDate: value.endDate as Date,
            });
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.touchUi = (event.target as Window).innerWidth < 768;
    }
}
