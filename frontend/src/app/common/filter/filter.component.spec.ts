import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { FilterComponent } from './filter.component';
import { Filter } from '../../shared/constants/Filter';

describe('FilterComponent', () => {
    let component: FilterComponent;
    let fixture: ComponentFixture<FilterComponent>;

    const mockFilters: Filter[] = [
        { name: 'search', type: 'input' },
        {
            name: 'status',
            type: 'select',
            options: [
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' },
            ],
        },
        { name: 'archived', type: 'checkbox', label: 'Show archived' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FilterComponent, NoopAnimationsModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            queryParamMap: convertToParamMap({}),
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FilterComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('filterFields', mockFilters);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('form creation', () => {
        it('should create a form with controls for each filter field', () => {
            expect(component.filterForm).toBeTruthy();
            expect(component.filterForm.get('search')).toBeTruthy();
            expect(component.filterForm.get('status')).toBeTruthy();
            expect(component.filterForm.get('archived')).toBeTruthy();
        });

        it('should initialize form controls with null values', () => {
            expect(component.filterForm.get('search')!.value).toBeNull();
            expect(component.filterForm.get('status')!.value).toBeNull();
            expect(component.filterForm.get('archived')!.value).toBeNull();
        });

        it('should initialize form controls from query params', async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [FilterComponent, NoopAnimationsModule],
                providers: [
                    {
                        provide: ActivatedRoute,
                        useValue: {
                            snapshot: {
                                queryParamMap: convertToParamMap({ search: 'test' }),
                            },
                        },
                    },
                ],
            }).compileComponents();

            const fix = TestBed.createComponent(FilterComponent);
            const comp = fix.componentInstance;
            fix.componentRef.setInput('filterFields', mockFilters);
            fix.detectChanges();

            expect(comp.filterForm.get('search')!.value).toBe('test');
        });
    });

    describe('toggleBox', () => {
        it('should toggle filterBoxOpen signal', () => {
            expect(component.filterBoxOpen()).toBeFalse();
            component.toggleBox();
            expect(component.filterBoxOpen()).toBeTrue();
            component.toggleBox();
            expect(component.filterBoxOpen()).toBeFalse();
        });

        it('should update showFilters computed', () => {
            expect(component.showFilters()).toBe('closed');
            component.toggleBox();
            expect(component.showFilters()).toBe('open');
        });
    });

    describe('filter', () => {
        it('should emit onFilterChange with non-empty values', () => {
            const spy = spyOn(component.onFilterChange, 'emit');
            component.filterForm.get('search')!.setValue('bug');
            component.filter();

            expect(spy).toHaveBeenCalled();
            const emitted = spy.calls.mostRecent().args[0];
            expect(emitted['search']).toBe('bug');
        });

        it('should emit null for empty values', () => {
            const spy = spyOn(component.onFilterChange, 'emit');
            component.filter();

            expect(spy).toHaveBeenCalled();
            const emitted = spy.calls.mostRecent().args[0];
            expect(emitted['search']).toBeNull();
        });

        it('should close the filter box on subsequent calls', () => {
            // First call sets isFirstFiltering to false
            component.filter();
            expect(component.isFirstFiltering()).toBeFalse();

            // Second call should toggle box
            component.filterBoxOpen.set(true);
            component.filter();
            expect(component.filterBoxOpen()).toBeFalse();
        });
    });

    describe('resetFilters', () => {
        it('should reset the form', () => {
            component.filterForm.get('search')!.setValue('test');
            component.filterForm.get('status')!.setValue('open');
            component.resetFilters();

            expect(component.filterForm.get('search')!.value).toBeNull();
            expect(component.filterForm.get('status')!.value).toBeNull();
        });
    });

    describe('resetFormField', () => {
        it('should reset a specific field to null', () => {
            component.filterForm.get('search')!.setValue('test');
            component.resetFormField('search');
            expect(component.filterForm.get('search')!.value).toBeNull();
        });
    });

    describe('hasChanges', () => {
        it('should be false initially', () => {
            expect(component.hasChanges()).toBeFalse();
        });

        it('should be true after changing a form value', () => {
            component.filterForm.get('search')!.setValue('changed');
            expect(component.hasChanges()).toBeTrue();
        });
    });

    describe('activeFiltersCount', () => {
        it('should be 0 initially', () => {
            expect(component.activeFiltersCount()).toBe(0);
        });

        it('should count non-empty filters', () => {
            component.filterForm.get('search')!.setValue('test');
            component.filterForm.get('status')!.setValue('open');
            expect(component.activeFiltersCount()).toBe(2);
        });
    });

    describe('template', () => {
        it('should render the toggle button', () => {
            const el: HTMLElement = fixture.nativeElement;
            const btn = el.querySelector('button');
            expect(btn?.textContent).toContain('Show filters');
        });

        it('should render filter fields inside the form', () => {
            component.filterBoxOpen.set(true);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            const form = el.querySelector('form');
            expect(form).toBeTruthy();
        });

        it('should render Apply and Reset buttons', () => {
            component.filterBoxOpen.set(true);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            const buttons = el.querySelectorAll('button');
            const texts = Array.from(buttons).map((b) => b.textContent?.trim());
            expect(texts.some((t) => t?.includes('Apply filters'))).toBeTrue();
            expect(texts.some((t) => t?.includes('Reset filters'))).toBeTrue();
        });
    });
});
