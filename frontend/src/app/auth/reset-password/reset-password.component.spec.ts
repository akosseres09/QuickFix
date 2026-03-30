import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

describe('ResetPasswordComponent', () => {
    let component: ResetPasswordComponent;
    let fixture: ComponentFixture<ResetPasswordComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let snackbarService: jasmine.SpyObj<SnackbarService>;
    let router: Router;

    beforeEach(async () => {
        authService = jasmine.createSpyObj('AuthService', ['resetPassword'], {
            currentUserClaims: jasmine.createSpy().and.returnValue(null),
        });
        snackbarService = jasmine.createSpyObj('SnackbarService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [ResetPasswordComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: AuthService, useValue: authService },
                { provide: SnackbarService, useValue: snackbarService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            queryParamMap: {
                                get: () => null,
                            },
                        },
                    },
                },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigateByUrl');
        fixture = TestBed.createComponent(ResetPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ==================== form initialization ====================

    describe('form initialization', () => {
        it('should have token, password and rePassword controls', () => {
            expect(component.form.get('token')).toBeTruthy();
            expect(component.form.get('password')).toBeTruthy();
            expect(component.form.get('rePassword')).toBeTruthy();
        });

        it('should be invalid when empty', () => {
            expect(component.form.valid).toBeFalse();
        });

        it('should require token', () => {
            const ctrl = component.form.get('token')!;
            ctrl.setValue('');
            ctrl.updateValueAndValidity();
            expect(ctrl.hasError('required')).toBeTrue();
        });

        it('should require password with min length 6', () => {
            const pw = component.form.get('password')!;
            expect(pw.hasError('required')).toBeTrue();
            pw.setValue('abc');
            // Re-run only the control's own validators to avoid group validator overwriting errors
            pw.updateValueAndValidity({ onlySelf: true });
            expect(pw.hasError('minlength')).toBeTrue();
            pw.setValue('abcdef');
            pw.updateValueAndValidity({ onlySelf: true });
            expect(pw.hasError('minlength')).toBeFalse();
        });

        it('should require rePassword with min length 6', () => {
            const pw = component.form.get('password')!;
            const rpw = component.form.get('rePassword')!;
            expect(rpw.hasError('required')).toBeTrue();
            pw.setValue('abc');
            rpw.setValue('abc');
            component.form.updateValueAndValidity();
            expect(rpw.hasError('minlength')).toBeTrue();
        });
    });

    // ==================== password match ====================

    describe('password match validator', () => {
        it('should set mustMatch error when passwords differ', () => {
            component.form.get('password')!.setValue('password1');
            component.form.get('rePassword')!.setValue('password2');
            component.form.updateValueAndValidity();
            expect(component.form.get('rePassword')!.hasError('mustMatch')).toBeTrue();
        });

        it('should clear mustMatch error when passwords match', () => {
            component.form.get('password')!.setValue('password1');
            component.form.get('rePassword')!.setValue('password1');
            component.form.updateValueAndValidity();
            expect(component.form.get('rePassword')!.hasError('mustMatch')).toBeFalse();
        });
    });

    // ==================== getControl ====================

    describe('getControl', () => {
        it('should return form control by name', () => {
            expect(component.getControl('token')).toBe(component.form.get('token'));
        });

        it('should return null for non-existent controls', () => {
            expect(component.getControl('nonexistent')).toBeNull();
        });
    });

    // ==================== reset ====================

    describe('reset', () => {
        function fillValidForm() {
            component.form.patchValue({
                token: 'valid-token',
                password: 'newpassword',
                rePassword: 'newpassword',
            });
            component.form.updateValueAndValidity();
        }

        it('should not call resetPassword when form is invalid', () => {
            component.reset();
            expect(authService.resetPassword).not.toHaveBeenCalled();
        });

        it('should call authService.resetPassword with token and password', () => {
            authService.resetPassword.and.returnValue(of({ success: true }));
            fillValidForm();
            component.reset();
            expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword');
        });

        it('should navigate to /auth/login on success', () => {
            authService.resetPassword.and.returnValue(of({ success: true }));
            fillValidForm();
            component.reset();
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
        });

        it('should show success snackbar on success', () => {
            authService.resetPassword.and.returnValue(of({ success: true }));
            fillValidForm();
            component.reset();
            expect(snackbarService.success).toHaveBeenCalledWith('Password reset successfully!');
        });

        it('should show error snackbar on failure', () => {
            const error = { error: { error: { message: 'Token expired' } } };
            authService.resetPassword.and.returnValue(throwError(() => error));
            fillValidForm();
            component.reset();
            expect(snackbarService.error).toHaveBeenCalledWith('Token expired');
        });

        it('should show default error message on failure without message', () => {
            authService.resetPassword.and.returnValue(throwError(() => ({ error: {} })));
            fillValidForm();
            component.reset();
            expect(snackbarService.error).toHaveBeenCalledWith(
                'Error resetting password. Please try again later.'
            );
        });

        it('should reset isLoading after success', () => {
            authService.resetPassword.and.returnValue(of({ success: true }));
            fillValidForm();
            component.reset();
            expect(component.isLoading()).toBeFalse();
        });

        it('should reset isLoading after error', () => {
            authService.resetPassword.and.returnValue(throwError(() => ({ error: {} })));
            fillValidForm();
            component.reset();
            expect(component.isLoading()).toBeFalse();
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display Reset Password heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('Reset Password');
        });

        it('should have token, password, and rePassword inputs', () => {
            const inputs = fixture.nativeElement.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThanOrEqual(3);
        });

        it('should have a submit button', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
        });

        it('should have a link to request password reset page', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            const resendLink = Array.from(links).find(
                (a: any) => a.textContent?.trim() === 'Resend Email'
            );
            expect(resendLink).toBeTruthy();
        });
    });
});
