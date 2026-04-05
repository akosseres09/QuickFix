import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { NotFoundComponent } from './not-found.component';
import { AuthService } from '../../shared/services/auth/auth.service';

describe('NotFoundComponent', () => {
    let component: NotFoundComponent;
    let fixture: ComponentFixture<NotFoundComponent>;
    let router: Router;
    let userSignal: ReturnType<typeof signal<any>>;

    beforeEach(async () => {
        userSignal = signal(null);

        await TestBed.configureTestingModule({
            imports: [NotFoundComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                {
                    provide: AuthService,
                    useValue: { currentUserClaims: userSignal },
                },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        fixture = TestBed.createComponent(NotFoundComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ==================== signals ====================

    describe('signals', () => {
        it('should initialize glitchActive as false', () => {
            expect(component.glitchActive()).toBeFalse();
        });

        it('should initialize floatingOffset as 0', () => {
            expect(component.floatingOffset()).toBe(0);
        });

        it('should initialize rotationOffset as 0', () => {
            expect(component.rotationOffset()).toBe(0);
        });
    });

    // ==================== floatingTickets ====================

    describe('floatingTickets', () => {
        it('should generate 20 floating tickets', () => {
            expect(component.floatingTickets.length).toBe(20);
        });

        it('should have valid properties for each ticket', () => {
            component.floatingTickets.forEach((ticket) => {
                expect(ticket.left).toBeGreaterThanOrEqual(0);
                expect(ticket.left).toBeLessThanOrEqual(100);
                expect(ticket.top).toBeGreaterThanOrEqual(0);
                expect(ticket.top).toBeLessThanOrEqual(100);
                expect(ticket.duration).toBeGreaterThanOrEqual(3);
                expect(ticket.duration).toBeLessThanOrEqual(7);
                expect(ticket.id).toBeGreaterThanOrEqual(1000);
                expect(ticket.id).toBeLessThanOrEqual(10998);
            });
        });
    });

    // ==================== goBack ====================

    describe('goBack', () => {
        it('should call window.history.back', () => {
            spyOn(window.history, 'back');
            component.goBack();
            expect(window.history.back).toHaveBeenCalled();
        });
    });

    // ==================== goHome ====================

    describe('goHome', () => {
        it('should navigate to /issues when user is logged in', () => {
            userSignal.set({ uid: '1', email: 'test@e.com', role: { name: 'user', value: 0 } });
            component.goHome();
            expect(router.navigate).toHaveBeenCalledWith(['/issues']);
        });

        it('should navigate to / when user is not logged in', () => {
            component.goHome();
            expect(router.navigate).toHaveBeenCalledWith(['/']);
        });
    });

    // ==================== viewAllIssues ====================

    describe('viewAllIssues', () => {
        it('should navigate to /issues', () => {
            component.viewAllIssues();
            expect(router.navigate).toHaveBeenCalledWith(['/issues']);
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display TICKET-404 heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('TICKET-404');
        });

        it('should display Not Found text', () => {
            const h2 = fixture.nativeElement.querySelector('h2');
            expect(h2?.textContent).toContain('Not Found');
        });

        it('should show error details section', () => {
            const details = fixture.nativeElement.querySelector('h3');
            expect(details?.textContent).toContain('Error Details');
        });

        it('should show login button when user is not logged in', () => {
            const buttons = fixture.nativeElement.querySelectorAll('button');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });
    });
});
