import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { VerifyComponent } from './verify.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

function buildActivatedRoute(token: string | null = null) {
    return {
        snapshot: {
            queryParamMap: {
                get: (key: string) => (key === 'token' ? token : null),
            },
        },
    };
}

describe('VerifyComponent', () => {
    let component: VerifyComponent;
    let fixture: ComponentFixture<VerifyComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let snackbarService: jasmine.SpyObj<SnackbarService>;
    let router: Router;

    beforeEach(async () => {
        authService = jasmine.createSpyObj('AuthService', ['verify'], {
            currentUserClaims: jasmine.createSpy().and.returnValue(null),
        });
        snackbarService = jasmine.createSpyObj('SnackbarService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [VerifyComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: AuthService, useValue: authService },
                { provide: SnackbarService, useValue: snackbarService },
                { provide: ActivatedRoute, useValue: buildActivatedRoute(null) },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigateByUrl');
        fixture = TestBed.createComponent(VerifyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ==================== form initialization ====================

    describe('form initialization', () => {
        it('should have an empty token by default', () => {
            expect(component.verifyForm.get('token')?.value).toBe('');
        });

        it('should be invalid when token is empty', () => {
            expect(component.verifyForm.valid).toBeFalse();
        });

        it('should require token', () => {
            const ctrl = component.verifyForm.get('token')!;
            expect(ctrl.hasError('required')).toBeTrue();
        });

        it('should enforce maxLength of 255', () => {
            const ctrl = component.verifyForm.get('token')!;
            ctrl.setValue('a'.repeat(256));
            expect(ctrl.hasError('maxlength')).toBeTrue();
            ctrl.setValue('a'.repeat(255));
            expect(ctrl.hasError('maxlength')).toBeFalse();
        });

        it('should be valid with a proper token', () => {
            component.verifyForm.get('token')!.setValue('valid-token');
            expect(component.verifyForm.valid).toBeTrue();
        });
    });

    // ==================== getControl ====================

    describe('getControl', () => {
        it('should return form control by name', () => {
            expect(component.getControl('token')).toBe(component.verifyForm.get('token'));
        });

        it('should return null for non-existent controls', () => {
            expect(component.getControl('nonexistent')).toBeNull();
        });
    });

    // ==================== onSubmit ====================

    describe('onSubmit', () => {
        it('should not call verify when form is invalid', () => {
            component.onSubmit();
            expect(authService.verify).not.toHaveBeenCalled();
        });

        it('should call authService.verify with the token', () => {
            authService.verify.and.returnValue(of({ success: true }));
            component.verifyForm.get('token')!.setValue('my-token');
            component.onSubmit();
            expect(authService.verify).toHaveBeenCalledWith('my-token');
        });

        it('should navigate to /auth/login on success', () => {
            authService.verify.and.returnValue(of({ success: true }));
            component.verifyForm.get('token')!.setValue('my-token');
            component.onSubmit();
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
        });

        it('should show success snackbar on success', () => {
            authService.verify.and.returnValue(of({ success: true }));
            component.verifyForm.get('token')!.setValue('my-token');
            component.onSubmit();
            expect(snackbarService.success).toHaveBeenCalledWith('Account Verified!');
        });

        it('should show error snackbar on failure', () => {
            const error = { error: { error: { message: 'Token expired' } } };
            authService.verify.and.returnValue(throwError(() => error));
            component.verifyForm.get('token')!.setValue('bad-token');
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Token expired');
        });

        it('should show default error message on failure without message', () => {
            authService.verify.and.returnValue(throwError(() => ({ error: {} })));
            component.verifyForm.get('token')!.setValue('bad-token');
            component.onSubmit();
            expect(snackbarService.error).toHaveBeenCalledWith('Failed to verify account!');
        });

        it('should reset isLoading after success', () => {
            authService.verify.and.returnValue(of({ success: true }));
            component.verifyForm.get('token')!.setValue('my-token');
            component.onSubmit();
            expect(component.isLoading()).toBeFalse();
        });

        it('should reset isLoading after error', () => {
            authService.verify.and.returnValue(throwError(() => ({ error: {} })));
            component.verifyForm.get('token')!.setValue('bad-token');
            component.onSubmit();
            expect(component.isLoading()).toBeFalse();
        });
    });

    // ==================== template ====================

    describe('template', () => {
        it('should display Verify Account heading', () => {
            const h1 = fixture.nativeElement.querySelector('h1');
            expect(h1?.textContent).toContain('Verify Account');
        });

        it('should have a token input', () => {
            const input = fixture.nativeElement.querySelector('input[formcontrolname="token"]');
            expect(input).toBeTruthy();
        });

        it('should have a submit button', () => {
            const button = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
        });

        it('should have a link to resend verification', () => {
            const links = fixture.nativeElement.querySelectorAll('a');
            const resendLink = Array.from(links).find(
                (a: any) => a.getAttribute('href') === '/auth/resend-verification'
            );
            expect(resendLink).toBeTruthy();
        });
    });
});
