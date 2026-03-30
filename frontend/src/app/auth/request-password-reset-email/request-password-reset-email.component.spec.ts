import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RequestPasswordResetEmailComponent } from './request-password-reset-email.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

describe('RequestPasswordResetEmailComponent', () => {
    let component: RequestPasswordResetEmailComponent;
    let fixture: ComponentFixture<RequestPasswordResetEmailComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let snackbarService: jasmine.SpyObj<SnackbarService>;

    beforeEach(async () => {
        authService = jasmine.createSpyObj('AuthService', ['resendEmail'], {
            currentUserClaims: jasmine.createSpy().and.returnValue(null),
        });
        snackbarService = jasmine.createSpyObj('SnackbarService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [RequestPasswordResetEmailComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: AuthService, useValue: authService },
                { provide: SnackbarService, useValue: snackbarService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RequestPasswordResetEmailComponent);
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
            ctrl.setValue('not-email');
            expect(ctrl.hasError('email')).toBeTrue();
            ctrl.setValue('valid@example.com');
            expect(ctrl.hasError('email')).toBeFalse();
        });

        it('should be valid with a proper email', () => {
            component.getControl('email')!.setValue('test@example.com');
            expect((component as any).form.valid).toBeTrue();
        });
    });

    // ==================== getControl ====================

    describe('getControl', () => {
        it('should return control by name', () => {
            expect(component.getControl('email')).toBe((component as any).form.get('email'));
        });

        it('should return null for non-existent controls', () => {
            expect(component.getControl('nonexistent')).toBeNull();
        });
    });

    // ==================== onSubmit ====================

    describe('onSubmit', () => {
        it('should not proceed when form is invalid', () => {
            component.onSubmit();
            // onSubmit only returns early; no service call since it just guards
            expect(authService.resendEmail).not.toHaveBeenCalled();
        });
    });

    // ==================== resend ====================

    describe('resend', () => {
        it('should not call resendEmail when email is empty', () => {
            component.resend('');
            expect(authService.resendEmail).not.toHaveBeenCalled();
        });

        it('should call authService.resendEmail with correct params', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.resend('test@example.com');
            expect(authService.resendEmail).toHaveBeenCalledWith(
                'test@example.com',
                '/auth/reset-password'
            );
        });

        it('should show success snackbar on success', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.resend('test@example.com');
            expect(snackbarService.success).toHaveBeenCalledWith('Email sent successfully!');
        });

        it('should show error snackbar on failure', () => {
            const error = { error: { error: { message: 'Rate limited' } } };
            authService.resendEmail.and.returnValue(throwError(() => error));
            component.resend('test@example.com');
            expect(snackbarService.error).toHaveBeenCalledWith('Rate limited');
        });

        it('should show default error message on failure without message', () => {
            authService.resendEmail.and.returnValue(throwError(() => ({ error: {} })));
            component.resend('test@example.com');
            expect(snackbarService.error).toHaveBeenCalledWith(
                'Error sending email. Please try again later.'
            );
        });

        it('should reset isLoading after success', () => {
            authService.resendEmail.and.returnValue(of({ success: true }));
            component.resend('test@example.com');
            expect((component as any).isLoading()).toBeFalse();
        });

        it('should reset isLoading after error', () => {
            authService.resendEmail.and.returnValue(throwError(() => ({ error: {} })));
            component.resend('test@example.com');
            expect((component as any).isLoading()).toBeFalse();
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display Request Password Reset heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('Request Password Reset');
        });

        it('should have an email input', () => {
            const input = fixture.nativeElement.querySelector('input[formcontrolname="email"]');
            expect(input).toBeTruthy();
        });

        it('should have a submit button', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
        });

        it('should have a link to reset password page', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            const resetLink = Array.from(links).find((a: any) =>
                a.getAttribute('href')?.includes('reset-password')
            );
            expect(resetLink).toBeTruthy();
        });
    });
});
