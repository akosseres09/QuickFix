import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
    let component: LineChartComponent;
    let fixture: ComponentFixture<LineChartComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LineChartComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(LineChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('default state', () => {
        it('should have lineChartType as line', () => {
            expect(component.lineChartType).toBe('line');
        });

        it('should have empty data by default', () => {
            expect(component.lineChartData.labels!.length).toBe(0);
            expect(component.lineChartData.datasets[0].data.length).toBe(0);
        });

        it('should have chart options with responsive true', () => {
            expect(component.lineChartOptions!.responsive).toBeTrue();
        });

        it('should default isLoading to false', () => {
            expect(component.isLoading()).toBeFalse();
        });
    });

    describe('updateChartData', () => {
        it('should compute cumulative data from daysMap', () => {
            const map = new Map<string, number>();
            map.set('2024-01-01', 2);
            map.set('2024-01-02', 3);
            map.set('2024-01-03', 5);

            fixture.componentRef.setInput('daysMap', map);
            fixture.detectChanges();

            expect(component.lineChartData.datasets[0].data).toEqual([2, 5, 10]);
        });

        it('should sort days chronologically', () => {
            const map = new Map<string, number>();
            map.set('2024-01-03', 1);
            map.set('2024-01-01', 4);
            map.set('2024-01-02', 2);

            fixture.componentRef.setInput('daysMap', map);
            fixture.detectChanges();

            // 4, 4+2=6, 6+1=7
            expect(component.lineChartData.datasets[0].data).toEqual([4, 6, 7]);
        });

        it('should handle empty daysMap', () => {
            fixture.componentRef.setInput('daysMap', new Map());
            fixture.detectChanges();

            expect(component.lineChartData.labels!.length).toBe(0);
            expect(component.lineChartData.datasets[0].data.length).toBe(0);
        });

        it('should format labels as month day', () => {
            const map = new Map<string, number>();
            map.set('2024-03-20', 5);

            fixture.componentRef.setInput('daysMap', map);
            fixture.detectChanges();

            const label = component.lineChartData.labels![0] as string;
            expect(label).toContain('Mar');
            expect(label).toContain('20');
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
