import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SpeedDialComponent } from './speed-dial.component';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';

describe('SpeedDialComponent', () => {
    let component: SpeedDialComponent;
    let fixture: ComponentFixture<SpeedDialComponent>;

    const testButtons: SpeedDialButton[] = [
        { iconName: 'add', label: 'Create', shown: true, onClick: () => {} },
        { iconName: 'edit', label: 'Edit', shown: true, onClick: () => {} },
        { iconName: 'delete', label: 'Remove', shown: false, onClick: () => {} },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SpeedDialComponent, NoopAnimationsModule],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(SpeedDialComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('buttons', testButtons);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('onTogglerClick', () => {
        it('should toggle from closed to open', () => {
            expect(component.getDialState()).toBe('closed');
            component.onTogglerClick();
            expect(component.getDialState()).toBe('open');
        });

        it('should toggle from open to closed', () => {
            component.onTogglerClick(); // open
            component.onTogglerClick(); // close
            expect(component.getDialState()).toBe('closed');
        });

        it('should set selectedRow to null when closing', () => {
            component.selectedRow.set({ id: '1' });
            component.onTogglerClick(); // open
            component.onTogglerClick(); // close
            expect(component.selectedRow()).toBeNull();
        });
    });

    describe('close', () => {
        it('should close if open', () => {
            component.onTogglerClick(); // open
            component.close();
            expect(component.getDialState()).toBe('closed');
        });

        it('should do nothing if already closed', () => {
            component.close();
            expect(component.getDialState()).toBe('closed');
        });

        it('should set selectedRow to null', () => {
            component.onTogglerClick();
            component.selectedRow.set({ id: '1' });
            component.close();
            expect(component.selectedRow()).toBeNull();
        });
    });

    describe('open', () => {
        it('should open if closed and has buttons', () => {
            component.open();
            expect(component.getDialState()).toBe('open');
        });

        it('should not open if already open', () => {
            component.open();
            component.open();
            expect(component.getDialState()).toBe('open');
        });

        it('should not open if no shown buttons', () => {
            fixture.componentRef.setInput('buttons', [
                { iconName: 'add', label: 'Create', shown: false },
            ]);
            fixture.detectChanges();
            component.open();
            expect(component.getDialState()).toBe('closed');
        });
    });

    describe('isOpen', () => {
        it('should return false when closed', () => {
            expect(component.isOpen()).toBeFalse();
        });

        it('should return true when open', () => {
            component.open();
            expect(component.isOpen()).toBeTrue();
        });
    });

    describe('template', () => {
        it('should render the main FAB button', () => {
            const fab = fixture.nativeElement.querySelector('button[mat-fab]');
            expect(fab).toBeTruthy();
        });

        it('should not show action buttons when closed', () => {
            const actionButtons = fixture.nativeElement.querySelectorAll('button.flex');
            expect(actionButtons.length).toBe(0);
        });

        it('should show action buttons for shown items when open', () => {
            component.onTogglerClick();
            fixture.detectChanges();
            expect(component['shownButtons']().length).toBe(2);
        });
    });
});
