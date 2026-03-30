import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NavitemComponent } from './navitem.component';
import { SidenavRoute, ChildRoute } from '../../../shared/constants/route/Routes';

describe('NavitemComponent', () => {
    let component: NavitemComponent;
    let fixture: ComponentFixture<NavitemComponent>;

    const testRoutes: SidenavRoute[] = [
        { name: 'Dashboard', type: 'button', path: '/dashboard', icon: 'home' },
        {
            name: 'Manage',
            type: 'menu',
            icon: 'settings',
            children: [
                { name: 'Members', path: '/members', icon: 'people' },
                { name: 'Settings', path: '/settings', icon: 'settings' },
            ],
        },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavitemComponent, NoopAnimationsModule],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(NavitemComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('routes', testRoutes);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should accept routes input', () => {
        expect(component.routes().length).toBe(2);
    });

    describe('isChildrenActive', () => {
        it('should return false when no child route is active', () => {
            const children: ChildRoute[] = [{ name: 'Members', path: '/members', icon: 'people' }];
            expect(component.isChildrenActive(children)).toBeFalse();
        });
    });

    describe('template', () => {
        it('should render button-type routes as links', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            expect(links.length).toBeGreaterThanOrEqual(1);
        });

        it('should render menu-type routes with expansion panels', () => {
            const panels = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
            expect(panels.length).toBeGreaterThanOrEqual(1);
        });
    });
});
