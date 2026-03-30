import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ResendVerificationComponent } from './resend-verification.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

describe('ResendVerificationComponent', () => {
    let component: ResendVerificationComponent;
    let fixture: ComponentFixture<ResendVerificationComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let snackbarService: jasmine.SpyObj<SnackbarService>;
    let router: Router;

    beforeEach(async () => {
        authService = jasmine.createSpyObj('AuthService', ['resendEmail'], {
            currentUserClaims: jasmine.createSpy().and.returnValue(null),
        });
        snackbarService = jasmine.createSpyObj('SnackbarService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [ResendVerificationComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: AuthService, useValue: authService },
                { provide: SnackbarService, useValue: snackbarService },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigateByUrl');
        fixture = TestBed.createComponent(ResendVerificationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ==================== form initialization ====================

    describe('form initialization', () => {
        it('should have an empty email by default', () => {
            expect(component.getControl('email')?.value).toBe('');
        });

        it('should be invalid when empty', () => {
            expect((component as any).form.valid).toBeFalse();
        });

        it('should require email', () => {
            const ctrl = component.getControl('email')!;
            expect(ctrl.hasError('required')).toBeTrue();
        });

        it('should validate email format', () => {
            const ctrl = component.getControl('email')!;
            ctrl.setValue('bad');
            expect(ctrl.hasError('email')).toBeTrue();
            ctrl.setValue('good@example.com');
            expect(ctrl.hasError('email')).toBeFalse();
        });

        it('should be valid with a proper email', () => {
            component.getControl('email')!.setValue('test@example.com');
            expect((component as any).form.valid).toBeTrue();
        });
    });

    // ==================== getControl ====================

    describe('getControl', () => {
        it('should return form control by name', () => {
            expect(component.getControl('email')).toBe((component as any).form.get('email'));
        });

        it('should return null for non-existent controls', () => {
            expect(component.getControl('nonexistent')).toBeNull();
        });
    });

    // ==================== resend ====================

    describe('resend', () => {
        it('should not call resendEmail when form is invalid', () => {
            component.resend();
            expect(authService.resendEmail).not.toHaveBeenCalled();
        });

        it('should call authService.resendEmail with the email', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect(authService.resendEmail).toHaveBeenCalledWith('test@example.com');
        });

        it('should navigate to /auth/verify on success', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/verify');
        });

        it('should show success snackbar on success', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect(snackbarService.success).toHaveBeenCalledWith(
                'Verification email sent successfully!'
            );
        });

        it('should show error snackbar on failure', () => {
            const error = { error: { error: { message: 'User not found' } } };
            authService.resendEmail.and.returnValue(throwError(() => error));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect(snackbarService.error).toHaveBeenCalledWith('User not found');
        });

        it('should show default error message on failure without message', () => {
            authService.resendEmail.and.returnValue(throwError(() => ({ error: {} })));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect(snackbarService.error).toHaveBeenCalledWith(
                'An error occurred while sending the verification email.'
            );
        });

        it('should reset isLoading after success', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect((component as any).isLoading()).toBeFalse();
        });

        it('should reset isLoading after error', () => {
            authService.resendEmail.and.returnValue(throwError(() => ({ error: {} })));
            component.getControl('email')!.setValue('test@example.com');
            component.resend();
            expect((component as any).isLoading()).toBeFalse();
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display Resend Verification Email heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('Resend Verification Email');
        });

        it('should have an email input', () => {
            const input = fixture.nativeElement.querySelector('input[formcontrolname="email"]');
            expect(input).toBeTruthy();
        });

        it('should have a submit button', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
        });

        it('should have a link to verify page', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            const verifyLink = Array.from(links).find(
                (a: any) => a.getAttribute('href') === '/auth/verify'
            );
            expect(verifyLink).toBeTruthy();
        });
    });
});
