import {
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    OnInit,
    output,
    signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { Filter } from '../../shared/constants/Filter';
import { filterBoxAnimation } from '../../shared/utils/animations';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-filter',
    imports: [
        ReactiveFormsModule,
        CommonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
    ],
    templateUrl: './filter.component.html',
    styleUrl: './filter.component.css',
    animations: [filterBoxAnimation],
})
export class FilterComponent implements OnInit {
    onFilterChange = output<ApiQueryParams>();
    filterFields = input.required<Filter[]>();

    private readonly fb = inject(FormBuilder);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    filterForm!: FormGroup;

    baseFormValues = signal<any>({});
    currentFormValues = signal<any>({});
    hasChanges = computed(() => {
        return JSON.stringify(this.baseFormValues()) !== JSON.stringify(this.currentFormValues());
    });
    activeFiltersCount = computed(() => {
        const values = this.currentFormValues();
        return Object.entries(values).filter(
            ([_, value]) => value !== null && value !== undefined && value !== ''
        ).length;
    });

    filterBoxOpen = signal(false);
    showFilters = computed(() => (this.filterBoxOpen() ? 'open' : 'closed'));

    ngOnInit(): void {
        this.filterForm = this.createFilterForm();
        this.baseFormValues.set(this.filterForm.value);
        this.currentFormValues.set(this.filterForm.value);

        // Track form changes reactively
        this.filterForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.currentFormValues.set(value);
            });

        this.filter();
    }

    toggleBox() {
        this.filterBoxOpen.update((open) => !open);
    }

    resetFilters() {
        this.filterForm.reset();
    }

    resetFormField(fieldName: string) {
        this.filterForm.get(fieldName)?.setValue(null);
    }

    private createFilterForm() {
        const group: Record<string, any> = {};

        this.filterFields().forEach((filter) => {
            const startValue = this.activeRoute.snapshot.queryParamMap.get(filter.name) || null;

            group[filter.name] = [startValue, filter.validators || []];
        });

        return this.fb.group(group);
    }

    filter() {
        const formValue = this.filterForm.value;
        const filteredValue: ApiQueryParams = {};

        Object.entries(formValue).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                if (
                    typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'boolean'
                ) {
                    filteredValue[key] = value;
                }
            } else {
                filteredValue[key] = null;
            }
        });

        this.onFilterChange.emit(filteredValue);
        this.baseFormValues.set(this.filterForm.value);
    }
}
