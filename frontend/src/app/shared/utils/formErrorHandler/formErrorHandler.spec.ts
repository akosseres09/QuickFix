import { FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { isValidationError, applyValidationErrors } from './formErrorHandler';

describe('formErrorHandler', () => {
    // ==================== isValidationError ====================

    describe('isValidationError', () => {
        it('should return true for a 422 response with error.details', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: { email: ['Email is required'] } } },
            });
            expect(isValidationError(error)).toBeTrue();
        });

        it('should return false for a 400 status', () => {
            const error = new HttpErrorResponse({
                status: 400,
                error: { error: { details: { email: ['Email is required'] } } },
            });
            expect(isValidationError(error)).toBeFalse();
        });

        it('should return false for a 500 status', () => {
            const error = new HttpErrorResponse({
                status: 500,
                error: { message: 'Internal server error' },
            });
            expect(isValidationError(error)).toBeFalse();
        });

        it('should return false when error has no details', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { message: 'Validation failed' } },
            });
            expect(isValidationError(error)).toBeFalse();
        });

        it('should return false when error body is null', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: null,
            });
            expect(isValidationError(error)).toBeFalse();
        });

        it('should return false when error.error is missing', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { something: 'else' },
            });
            expect(isValidationError(error)).toBeFalse();
        });

        it('should return true when details is an empty object', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: {} } },
            });
            expect(isValidationError(error)).toBeTrue();
        });

        it('should return false for a 422 with details = null', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: null } },
            });
            expect(isValidationError(error)).toBeFalse();
        });
    });

    // ==================== applyValidationErrors ====================

    describe('applyValidationErrors', () => {
        let form: FormGroup;

        beforeEach(() => {
            form = new FormGroup({
                email: new FormControl(''),
                firstName: new FormControl(''),
                lastName: new FormControl(''),
                phoneNumber: new FormControl(''),
            });
        });

        it('should apply server errors to matching form controls (snake_case → camelCase)', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: {
                    error: {
                        details: {
                            first_name: ['First name is required'],
                            email: ['Email already taken'],
                        },
                    },
                },
            });

            const result = applyValidationErrors(form, error);

            expect(result).toBeTrue();
            expect(form.get('firstName')!.hasError('serverError')).toBeTrue();
            expect(form.get('firstName')!.getError('serverError')).toEqual([
                'First name is required',
            ]);
            expect(form.get('email')!.hasError('serverError')).toBeTrue();
            expect(form.get('email')!.getError('serverError')).toEqual(['Email already taken']);
        });

        it('should mark applied controls as touched', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: { email: ['Invalid'] } } },
            });

            expect(form.get('email')!.touched).toBeFalse();
            applyValidationErrors(form, error);
            expect(form.get('email')!.touched).toBeTrue();
        });

        it('should return false for non-validation errors', () => {
            const error = new HttpErrorResponse({
                status: 500,
                error: { message: 'Server error' },
            });

            const result = applyValidationErrors(form, error);
            expect(result).toBeFalse();
        });

        it('should return false when no fields match any form control', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: { unknown_field: ['Some error'] } } },
            });

            const result = applyValidationErrors(form, error);
            expect(result).toBeFalse();
        });

        it('should apply errors to multiple controls', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: {
                    error: {
                        details: {
                            first_name: ['Required'],
                            last_name: ['Required'],
                            phone_number: ['Invalid format'],
                        },
                    },
                },
            });

            const result = applyValidationErrors(form, error);
            expect(result).toBeTrue();
            expect(form.get('firstName')!.hasError('serverError')).toBeTrue();
            expect(form.get('lastName')!.hasError('serverError')).toBeTrue();
            expect(form.get('phoneNumber')!.hasError('serverError')).toBeTrue();
        });

        it('should handle a mix of matching and non-matching fields', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: {
                    error: {
                        details: {
                            email: ['Taken'],
                            nonexistent_field: ['Error'],
                        },
                    },
                },
            });

            const result = applyValidationErrors(form, error);
            expect(result).toBeTrue();
            expect(form.get('email')!.hasError('serverError')).toBeTrue();
        });

        it('should match a snake_case field directly if camelCase conversion misses', () => {
            // Add a control with snake_case name for the fallback
            const formWithSnake = new FormGroup({
                my_field: new FormControl(''),
            });

            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: { my_field: ['Error'] } } },
            });

            const result = applyValidationErrors(formWithSnake, error);
            expect(result).toBeTrue();
            expect(formWithSnake.get('my_field')!.hasError('serverError')).toBeTrue();
        });

        it('should set multiple error messages on one control', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: {
                    error: {
                        details: {
                            email: ['Email is required', 'Email format is invalid'],
                        },
                    },
                },
            });

            applyValidationErrors(form, error);
            expect(form.get('email')!.getError('serverError')).toEqual([
                'Email is required',
                'Email format is invalid',
            ]);
        });

        it('should not modify controls that have no server errors', () => {
            const error = new HttpErrorResponse({
                status: 422,
                error: { error: { details: { email: ['Error'] } } },
            });

            applyValidationErrors(form, error);
            expect(form.get('firstName')!.errors).toBeNull();
            expect(form.get('lastName')!.errors).toBeNull();
        });
    });
});
