import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { OrganizationInvitationService } from '../../shared/services/organization-invitation/organization-invitation.service';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let snackbarService: jasmine.SpyObj<SnackbarService>;
    let invitationService: jasmine.SpyObj<OrganizationInvitationService>;
    let router: Router;

    beforeEach(async () => {
        authService = jasmine.createSpyObj('AuthService', ['login'], {
            currentUserClaims: jasmine.createSpy().and.returnValue(null),
        });
        snackbarService = jasmine.createSpyObj('SnackbarService', ['success', 'error']);
        invitationService = jasmine.createSpyObj('OrganizationInvitationService', [
            'deleteInvitationToken',
        ]);

        await TestBed.configureTestingModule({
            imports: [LoginComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: AuthService, useValue: authService },
                { provide: SnackbarService, useValue: snackbarService },
                { provide: OrganizationInvitationService, useValue: invitationService },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ==================== form initialization ====================

    describe('form initialization', () => {
        it('should have an empty email and password by default', () => {
            expect(component.loginForm.get('email')?.value).toBe('');
            expect(component.loginForm.get('password')?.value).toBe('');
        });

        it('should be invalid when empty', () => {
            expect(component.loginForm.valid).toBeFalse();
        });

        it('should require email', () => {
            const email = component.loginForm.get('email')!;
            expect(email.hasError('required')).toBeTrue();
        });

        it('should validate email format', () => {
            const email = component.loginForm.get('email')!;
            email.setValue('invalid');
            expect(email.hasError('email')).toBeTrue();
            email.setValue('valid@email.com');
            expect(email.hasError('email')).toBeFalse();
        });

        it('should require password', () => {
            const pw = component.loginForm.get('password')!;
            expect(pw.hasError('required')).toBeTrue();
        });

        it('should enforce minimum password length of 6', () => {
            const pw = component.loginForm.get('password')!;
            pw.setValue('abc');
            expect(pw.hasError('minlength')).toBeTrue();
            pw.setValue('abcdef');
            expect(pw.hasError('minlength')).toBeFalse();
        });

        it('should be valid with proper email and password', () => {
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(component.loginForm.valid).toBeTrue();
        });
    });

    // ==================== getControl ====================

    describe('getControl', () => {
        it('should return the form control by name', () => {
            expect(component.getControl('email')).toBe(component.loginForm.get('email'));
            expect(component.getControl('password')).toBe(component.loginForm.get('password'));
        });

        it('should return null for non-existent controls', () => {
            expect(component.getControl('nonexistent')).toBeNull();
        });
    });

    // ==================== togglePwVisibility ====================

    describe('togglePwVisibility', () => {
        it('should toggle the pwVisible signal', () => {
            expect(component.pwVisible()).toBeFalse();

            const formField = fixture.nativeElement.querySelector('mat-form-field:nth-of-type(2)');
            const input = formField?.querySelector('input');
            const icon = formField?.querySelector('mat-icon[matsuffix]');

            if (icon && input) {
                const event = new MouseEvent('click');
                Object.defineProperty(event, 'target', { value: icon });
                component.togglePwVisibility(event);
                expect(component.pwVisible()).toBeTrue();
            }
        });
    });

    // ==================== onSubmit ====================

    describe('onSubmit', () => {
        it('should not call authService.login when form is invalid', () => {
            component.onSubmit();
            expect(authService.login).not.toHaveBeenCalled();
        });

        it('should call authService.login with correct credentials', () => {
            authService.login.and.returnValue(of({ access_token: 'fake-token' }));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        it('should navigate to /organizations on success when no redirectUrl', () => {
            authService.login.and.returnValue(of({ access_token: 'fake-token' }));
            component.redirectUrl = null;
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(router.navigate).toHaveBeenCalledWith(['/organizations']);
        });

        it('should navigate to redirectUrl on success when set', () => {
            authService.login.and.returnValue(of({ access_token: 'fake-token' }));
            component.redirectUrl = '/dashboard';
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        });

        it('should call invitationService.deleteInvitationToken on success', () => {
            authService.login.and.returnValue(of({ access_token: 'fake-token' }));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(invitationService.deleteInvitationToken).toHaveBeenCalled();
        });

        it('should remove redirectUrl from sessionStorage on success', () => {
            spyOn(sessionStorage, 'removeItem');
            authService.login.and.returnValue(of({ access_token: 'fake-token' }));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(sessionStorage.removeItem).toHaveBeenCalledWith('redirectUrl');
        });

        it('should show error snackbar on login failure', () => {
            const error = { error: { message: 'Invalid credentials' } };
            authService.login.and.returnValue(throwError(() => error));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Invalid credentials');
        });

        it('should show nested error message when present', () => {
            const error = { error: { error: { message: 'Account not verified' } } };
            authService.login.and.returnValue(throwError(() => error));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Account not verified');
        });

        it('should show default error message when no specific message', () => {
            authService.login.and.returnValue(throwError(() => ({ error: {} })));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Login failed. Please try again.');
        });

        it('should reset isLoading after error', () => {
            authService.login.and.returnValue(throwError(() => ({ error: {} })));
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            component.onSubmit();
            expect(component.isLoading()).toBeFalse();
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display the welcome heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('Welcome Back');
        });

        it('should have email and password inputs', () => {
            const inputs = fixture.nativeElement.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThanOrEqual(2);
        });

        it('should have a submit button', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
        });

        it('should disable submit button when form is invalid', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button.disabled).toBeTrue();
        });

        it('should enable submit button when form is valid', () => {
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
            });
            fixture.detectChanges();
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button.disabled).toBeFalse();
        });

        it('should have a link to the signup page', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            const signupLink = Array.from(links).find(
                (a: any) => a.getAttribute('href') === '/auth/signup'
            );
            expect(signupLink).toBeTruthy();
        });
    });
});
