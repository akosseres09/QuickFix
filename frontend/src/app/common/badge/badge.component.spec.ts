import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
    let component: BadgeComponent;
    let fixture: ComponentFixture<BadgeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BadgeComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(BadgeComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('text', 'Test Badge');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the text', () => {
        expect(fixture.nativeElement.textContent).toContain('Test Badge');
    });

    describe('badgeClasses', () => {
        it('should include default roundness (full)', () => {
            expect(component.badgeClasses).toContain('rounded-full');
        });

        it('should include default text size (sm)', () => {
            expect(component.badgeClasses).toContain('text-sm');
        });

        it('should include default font weight (medium)', () => {
            expect(component.badgeClasses).toContain('font-medium');
        });

        it('should use roundNess md', () => {
            fixture.componentRef.setInput('roundNess', 'md');
            fixture.detectChanges();
            expect(component.badgeClasses).toContain('rounded-md');
        });

        it('should use textSize lg', () => {
            fixture.componentRef.setInput('textSize', 'lg');
            fixture.detectChanges();
            expect(component.badgeClasses).toContain('text-lg');
        });

        it('should use fontWeight bold', () => {
            fixture.componentRef.setInput('fontWeight', 'bold');
            fixture.detectChanges();
            expect(component.badgeClasses).toContain('font-bold');
        });

        it('should include tailwind color when set', () => {
            fixture.componentRef.setInput('tailwindColor', 'bg-blue-500');
            fixture.detectChanges();
            expect(component.badgeClasses).toContain('bg-blue-500');
        });
    });

    describe('lightBackgroundColor', () => {
        it('should return null when no color is set', () => {
            expect(component.lightBackgroundColor).toBeNull();
        });

        it('should convert hex color to rgba', () => {
            fixture.componentRef.setInput('color', '#ff0000');
            fixture.detectChanges();
            expect(component.lightBackgroundColor).toBe('rgba(255, 0, 0, 0.15)');
        });

        it('should handle short hex', () => {
            fixture.componentRef.setInput('color', '#f00');
            fixture.detectChanges();
            expect(component.lightBackgroundColor).toBe('rgba(255, 0, 0, 0.15)');
        });
    });

    describe('template', () => {
        it('should apply inline color style when color is set', () => {
            fixture.componentRef.setInput('color', '#00ff00');
            fixture.detectChanges();
            const div = fixture.nativeElement.querySelector('div');
            expect(div.style.color).toBeTruthy();
            expect(div.style.borderColor).toBeTruthy();
        });

        it('should render an icon when icon input is set', () => {
            fixture.componentRef.setInput('icon', 'check');
            fixture.detectChanges();
            const icon = fixture.nativeElement.querySelector('mat-icon');
            expect(icon).toBeTruthy();
            expect(icon.textContent.trim()).toBe('check');
        });

        it('should not render an icon when icon is null', () => {
            expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();
        });
    });
});
