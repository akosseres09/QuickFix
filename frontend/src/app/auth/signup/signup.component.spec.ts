import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { SignupComponent } from './signup.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

describe('SignupComponent', () => {
    let component: SignupComponent;
    let fixture: ComponentFixture<SignupComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let snackbarService: jasmine.SpyObj<SnackbarService>;
    let router: Router;

    beforeEach(async () => {
        sessionStorage.removeItem('invitationToken');

        authService = jasmine.createSpyObj('AuthService', ['signup'], {
            currentUserClaims: jasmine.createSpy().and.returnValue(null),
        });
        snackbarService = jasmine.createSpyObj('SnackbarService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [SignupComponent, NoopAnimationsModule],
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
        fixture = TestBed.createComponent(SignupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        sessionStorage.removeItem('invitationToken');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ==================== form initialization ====================

    describe('form initialization', () => {
        it('should have all required form controls', () => {
            expect(component.signupForm.get('firstName')).toBeTruthy();
            expect(component.signupForm.get('lastName')).toBeTruthy();
            expect(component.signupForm.get('username')).toBeTruthy();
            expect(component.signupForm.get('email')).toBeTruthy();
            expect(component.signupForm.get('password')).toBeTruthy();
            expect(component.signupForm.get('confirmPassword')).toBeTruthy();
            expect(component.signupForm.get('dateOfBirth')).toBeTruthy();
            expect(component.signupForm.get('phoneNumber')).toBeTruthy();
        });

        it('should be invalid when empty', () => {
            expect(component.signupForm.valid).toBeFalse();
        });

        it('should require firstName', () => {
            const ctrl = component.signupForm.get('firstName')!;
            expect(ctrl.hasError('required')).toBeTrue();
        });

        it('should require lastName', () => {
            const ctrl = component.signupForm.get('lastName')!;
            expect(ctrl.hasError('required')).toBeTrue();
        });

        it('should require username with min length 5', () => {
            const ctrl = component.signupForm.get('username')!;
            expect(ctrl.hasError('required')).toBeTrue();
            ctrl.setValue('abc');
            expect(ctrl.hasError('minlength')).toBeTrue();
            ctrl.setValue('abcde');
            expect(ctrl.hasError('minlength')).toBeFalse();
        });

        it('should require a valid email', () => {
            const ctrl = component.signupForm.get('email')!;
            expect(ctrl.hasError('required')).toBeTrue();
            ctrl.setValue('bad');
            expect(ctrl.hasError('email')).toBeTrue();
            ctrl.setValue('valid@email.com');
            expect(ctrl.hasError('email')).toBeFalse();
        });

        it('should require password with min length 6', () => {
            const pw = component.signupForm.get('password')!;
            expect(pw.hasError('required')).toBeTrue();
            pw.setValue('abc');
            // Re-run only the control's own validators to avoid group validator overwriting errors
            pw.updateValueAndValidity({ onlySelf: true });
            expect(pw.hasError('minlength')).toBeTrue();
            pw.setValue('abcdef');
            pw.updateValueAndValidity({ onlySelf: true });
            expect(pw.hasError('minlength')).toBeFalse();
        });

        it('should require confirmPassword with min length 6', () => {
            const pw = component.signupForm.get('password')!;
            const cpw = component.signupForm.get('confirmPassword')!;
            expect(cpw.hasError('required')).toBeTrue();
            pw.setValue('abc');
            cpw.setValue('abc');
            component.signupForm.updateValueAndValidity();
            expect(cpw.hasError('minlength')).toBeTrue();
        });

        it('should not require dateOfBirth', () => {
            const ctrl = component.signupForm.get('dateOfBirth')!;
            expect(ctrl.hasError('required')).toBeFalse();
        });

        it('should not require phoneNumber', () => {
            const ctrl = component.signupForm.get('phoneNumber')!;
            expect(ctrl.hasError('required')).toBeFalse();
        });
    });

    // ==================== password match validation ====================

    describe('password match validator', () => {
        it('should set mustMatch error when passwords differ', () => {
            component.signupForm.get('password')!.setValue('password1');
            component.signupForm.get('confirmPassword')!.setValue('password2');
            component.signupForm.updateValueAndValidity();
            expect(component.signupForm.get('confirmPassword')!.hasError('mustMatch')).toBeTrue();
        });

        it('should clear mustMatch error when passwords match', () => {
            component.signupForm.get('password')!.setValue('password1');
            component.signupForm.get('confirmPassword')!.setValue('password1');
            component.signupForm.updateValueAndValidity();
            expect(component.signupForm.get('confirmPassword')!.hasError('mustMatch')).toBeFalse();
        });
    });

    // ==================== getControl ====================

    describe('getControl', () => {
        it('should return the form control by name', () => {
            expect(component.getControl('email')).toBe(component.signupForm.get('email'));
        });

        it('should return null for non-existent controls', () => {
            expect(component.getControl('nonexistent')).toBeNull();
        });
    });

    // ==================== togglePwVisibility ====================

    describe('togglePwVisibility', () => {
        it('should toggle pwVisible signal', () => {
            expect(component.pwVisible()).toBeFalse();

            // Find the password form field and its icon
            const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
            // password field should be the one with formControlName="password"
            let passwordField: HTMLElement | null = null;
            formFields.forEach((ff: HTMLElement) => {
                const input = ff.querySelector('input[formcontrolname="password"]');
                if (input) passwordField = ff;
            });

            if (passwordField) {
                const icon = (passwordField as HTMLElement).querySelector('mat-icon[matsuffix]');
                if (icon) {
                    const event = new MouseEvent('click');
                    Object.defineProperty(event, 'target', { value: icon });
                    component.togglePwVisibility(event);
                    expect(component.pwVisible()).toBeTrue();
                }
            }
        });
    });

    // ==================== onSubmit ====================

    describe('onSubmit', () => {
        function fillValidForm() {
            component.signupForm.patchValue({
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                email: 'john@example.com',
                password: 'password123',
                confirmPassword: 'password123',
            });
            component.signupForm.updateValueAndValidity();
        }

        it('should not call signup when form is invalid', () => {
            component.onSubmit();
            expect(authService.signup).not.toHaveBeenCalled();
        });

        it('should call authService.signup with correct data', () => {
            authService.signup.and.returnValue(of({ success: true }));
            fillValidForm();
            component.onSubmit();
            expect(authService.signup).toHaveBeenCalled();
            const callArgs = authService.signup.calls.mostRecent().args[0];
            expect(callArgs.firstName).toBe('John');
            expect(callArgs.lastName).toBe('Doe');
            expect(callArgs.username).toBe('johndoe');
            expect(callArgs.email).toBe('john@example.com');
        });

        it('should navigate to /auth/verify on success', () => {
            authService.signup.and.returnValue(of({ success: true }));
            fillValidForm();
            component.onSubmit();
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/verify');
        });

        it('should show success snackbar on success', () => {
            authService.signup.and.returnValue(of({ success: true }));
            fillValidForm();
            component.onSubmit();
            expect(snackbarService.success).toHaveBeenCalledWith(
                'Account created successfully! Please verify your email.'
            );
        });

        it('should show error snackbar on failure', () => {
            const error = { error: { error: { message: 'Email taken' } } };
            authService.signup.and.returnValue(throwError(() => error));
            fillValidForm();
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Email taken');
        });

        it('should show default error message on failure without message', () => {
            authService.signup.and.returnValue(throwError(() => ({ error: {} })));
            fillValidForm();
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Signup failed. Please try again.');
        });

        it('should reset isLoading after success', () => {
            authService.signup.and.returnValue(of({ success: true }));
            fillValidForm();
            component.onSubmit();
            expect(component.isLoading()).toBeFalse();
        });

        it('should reset isLoading after error', () => {
            authService.signup.and.returnValue(throwError(() => ({ error: {} })));
            fillValidForm();
            component.onSubmit();
            expect(component.isLoading()).toBeFalse();
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display Create Account heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('Create Account');
        });

        it('should have a submit button', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
        });

        it('should have form fields for all inputs', () => {
            const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
            expect(formFields.length).toBeGreaterThanOrEqual(6);
        });

        it('should have a link to the login page', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            const loginLink = Array.from(links).find(
                (a: any) => a.getAttribute('href') === '/auth/login'
            );
            expect(loginLink).toBeTruthy();
        });
    });

    // ==================== maxDate ====================

    describe('maxDate', () => {
        it('should set maxDate to 16 years ago', () => {
            const maxDate = component.maxDate();
            const expected = new Date();
            expected.setFullYear(expected.getFullYear() - 16);
            // Compare year only to avoid timing flakes
            expect(maxDate.getFullYear()).toBe(expected.getFullYear());
        });
    });
});
