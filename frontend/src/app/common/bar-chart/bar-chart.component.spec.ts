import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
    let component: BarChartComponent;
    let fixture: ComponentFixture<BarChartComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BarChartComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('default state', () => {
        it('should have barChartType as bar', () => {
            expect(component.barChartType).toBe('bar');
        });

        it('should have empty data by default', () => {
            expect(component.barChartData.labels!.length).toBe(0);
            expect(component.barChartData.datasets[0].data.length).toBe(0);
        });

        it('should have chart options with responsive true', () => {
            expect(component.barChartOptions!.responsive).toBeTrue();
        });

        it('should default isLoading to false', () => {
            expect(component.isLoading()).toBeFalse();
        });

        it('should default daysMap to empty map', () => {
            expect(component.daysMap().size).toBe(0);
        });
    });

    describe('updateChart', () => {
        it('should update barChartData from daysMap', () => {
            const map = new Map<string, number>();
            map.set('2024-01-01', 5);
            map.set('2024-01-02', 3);

            fixture.componentRef.setInput('daysMap', map);
            fixture.detectChanges();

            expect(component.barChartData.labels!.length).toBe(2);
            expect(component.barChartData.datasets[0].data).toEqual([5, 3]);
        });

        it('should sort days chronologically', () => {
            const map = new Map<string, number>();
            map.set('2024-01-05', 2);
            map.set('2024-01-01', 8);
            map.set('2024-01-03', 4);

            fixture.componentRef.setInput('daysMap', map);
            fixture.detectChanges();

            expect(component.barChartData.datasets[0].data).toEqual([8, 4, 2]);
        });

        it('should handle empty daysMap', () => {
            fixture.componentRef.setInput('daysMap', new Map());
            fixture.detectChanges();

            expect(component.barChartData.labels!.length).toBe(0);
            expect(component.barChartData.datasets[0].data.length).toBe(0);
        });

        it('should format labels as month day', () => {
            const map = new Map<string, number>();
            map.set('2024-01-15', 5);

            fixture.componentRef.setInput('daysMap', map);
            fixture.detectChanges();

            const label = component.barChartData.labels![0] as string;
            expect(label).toContain('Jan');
            expect(label).toContain('15');
        });
    });

    describe('template', () => {
        it('should render a canvas element', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('canvas')).toBeTruthy();
        });

        it('should show spinner when loading', () => {
            fixture.componentRef.setInput('isLoading', true);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-spinner')).toBeTruthy();
        });

        it('should not show spinner when not loading', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('mat-spinner')).toBeFalsy();
        });
    });
});
