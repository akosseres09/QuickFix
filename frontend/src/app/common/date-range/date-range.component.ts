import { Component, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import {
    MatDatepickerModule,
    MatDateRangeInput,
    MatDateRangePicker,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { fromEvent } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-date-range',
    standalone: true,
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
export class DateRangeComponent {
    private readonly fb = inject(FormBuilder);

    startDate = model<Date>(new Date());
    endDate = model<Date>(new Date());
    minDate = input<Date>();
    maxDate = input<Date>();
    dateRangeChange = output<{ startDate: string; endDate: string }>();

    protected touchUi = signal<boolean>(window.innerWidth < 768);

    readonly range = this.fb.group(
        {
            startDate: [new Date(), [Validators.required]],
            endDate: [new Date(), [Validators.required]],
        },
        { validators: this.validateDateRange.bind(this) }
    );

    constructor() {
        effect(() => {
            const s = this.startDate();
            const e = this.endDate();
            const min = this.minDate();
            const max = this.maxDate();

            let isInvalid = false;
            if (min && s < min) isInvalid = true;
            if (max && e > max) isInvalid = true;

            if (isInvalid) {
                let today = new Date();
                today.setHours(23, 59, 59, 999);

                if (max && today > max) {
                    today = new Date(max);
                }

                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                lastWeek.setHours(0, 0, 0, 0);

                untracked(() => {
                    this.startDate.set(lastWeek);
                    this.endDate.set(today);

                    this.dateRangeChange.emit({
                        startDate: lastWeek.toISOString(),
                        endDate: today.toISOString(),
                    });
                });
                return;
            }

            const currentStart = this.range.controls.startDate.value;
            const currentEnd = this.range.controls.endDate.value;

            if (s && s.getTime() !== currentStart?.getTime()) {
                this.range.controls.startDate.setValue(s, { emitEvent: false });
            }
            if (e && e.getTime() !== currentEnd?.getTime()) {
                this.range.controls.endDate.setValue(e, { emitEvent: false });
            }
        });

        this.range.valueChanges.pipe(debounceTime(200), takeUntilDestroyed()).subscribe((value) => {
            if (this.range.valid && value.startDate && value.endDate) {
                const s = new Date(value.startDate);
                const e = new Date(value.endDate);
                e.setHours(23, 59, 59, 999);

                this.startDate.set(s);
                this.endDate.set(e);

                this.dateRangeChange.emit({
                    startDate: s.toISOString(),
                    endDate: e.toISOString(),
                });
            }
        });

        fromEvent(window, 'resize')
            .pipe(
                map(() => window.innerWidth < 768),
                startWith(window.innerWidth < 768),
                takeUntilDestroyed()
            )
            .subscribe((isSmall) => this.touchUi.set(isSmall));
    }

    private validateDateRange(group: AbstractControl): ValidationErrors | null {
        const startVal = group.get('startDate')?.value;
        const endVal = group.get('endDate')?.value;
        const min = this.minDate();
        const max = this.maxDate();

        if (!startVal || !endVal) return null;

        const start = new Date(startVal);
        const end = new Date(endVal);
        end.setHours(23, 59, 59, 999);

        const errors: ValidationErrors = {};

        if (start > end) {
            errors['invalidRange'] = true;
        }
        if (min && start < min) {
            errors['minDateViolation'] = true;
        }
        if (max && end > max) {
            errors['maxDateViolation'] = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }
}
