import { FormControl, FormGroup } from '@angular/forms';
import { CustomValidators } from './CustomValidators';

describe('CustomValidators', () => {
    // ==================== enum ====================
    beforeEach(() => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date('2024-01-01'));
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    describe('enum', () => {
        enum Status {
            Active = 'active',
            Inactive = 'inactive',
            Pending = 'pending',
        }

        const validator = CustomValidators.enum(Status);

        it('should return null for a valid enum value', () => {
            const control = new FormControl('active');
            expect(validator(control)).toBeNull();
        });

        it('should return null for another valid enum value', () => {
            const control = new FormControl('pending');
            expect(validator(control)).toBeNull();
        });

        it('should return { invalidValue: true } for an invalid value', () => {
            const control = new FormControl('deleted');
            expect(validator(control)).toEqual({ invalidValue: true });
        });

        it('should return null for empty string (optional)', () => {
            const control = new FormControl('');
            expect(validator(control)).toBeNull();
        });

        it('should return null for null (optional)', () => {
            const control = new FormControl(null);
            expect(validator(control)).toBeNull();
        });

        it('should return null for whitespace-only string', () => {
            const control = new FormControl('   ');
            expect(validator(control)).toBeNull();
        });

        it('should be case-sensitive', () => {
            const control = new FormControl('Active');
            expect(validator(control)).toEqual({ invalidValue: true });
        });

        it('should work with a plain object as enum source', () => {
            const myEnum = { A: 'alpha', B: 'beta' };
            const v = CustomValidators.enum(myEnum);
            expect(v(new FormControl('alpha'))).toBeNull();
            expect(v(new FormControl('gamma'))).toEqual({ invalidValue: true });
        });
    });

    // ==================== minAgeValidator ====================

    describe('minAgeValidator', () => {
        const validator = CustomValidators.minAgeValidator(18);

        it('should return null for null value (optional)', () => {
            const control = new FormControl(null);
            expect(validator(control)).toBeNull();
        });

        it('should return null for empty string (optional)', () => {
            const control = new FormControl('');
            expect(validator(control)).toBeNull();
        });

        it('should return { invalidDate: true } for invalid date string', () => {
            const control = new FormControl('not-a-date');
            expect(validator(control)).toEqual({ invalidDate: true });
        });

        it('should return { futureDate: true } for a future date', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const control = new FormControl(futureDate.toISOString().split('T')[0]);
            expect(validator(control)).toEqual({ futureDate: true });
        });

        it('should return null when age is exactly the minimum', () => {
            const today = new Date();
            const dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            expect(validator(control)).toBeNull();
        });

        it('should return null when age exceeds the minimum', () => {
            const today = new Date();
            const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            expect(validator(control)).toBeNull();
        });

        it('should return minAge error when age is below minimum', () => {
            const today = new Date();
            const dob = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            const result = validator(control);
            expect(result).toBeTruthy();
            expect(result!['minAge']).toBeTruthy();
            expect(result!['minAge'].requiredAge).toBe(18);
            expect(result!['minAge'].actualAge).toBe(10);
        });

        it('should work with a different minimum age', () => {
            const v = CustomValidators.minAgeValidator(13);
            const today = new Date();
            const dob = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            expect(v(control)).toBeNull();
        });

        it('should return error when one day short of minimum age', () => {
            const today = new Date();

            const dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);

            const year = dob.getFullYear();
            const month = String(dob.getMonth() + 1).padStart(2, '0');
            const day = String(dob.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`; // "2006-01-02"

            const control = new FormControl(dateString);
            const result = validator(control);

            expect(result).toBeTruthy();
            expect(result!['minAge']).toBeTruthy();
            expect(result!['minAge'].actualAge).toBe(17);
        });
    });

    // ==================== maxAgeValidator ====================

    describe('maxAgeValidator', () => {
        const validator = CustomValidators.maxAgeValidator(120);

        it('should return null for null value (optional)', () => {
            const control = new FormControl(null);
            expect(validator(control)).toBeNull();
        });

        it('should return null for empty string (optional)', () => {
            const control = new FormControl('');
            expect(validator(control)).toBeNull();
        });

        it('should return { invalidDate: true } for invalid date string', () => {
            const control = new FormControl('invalid');
            expect(validator(control)).toEqual({ invalidDate: true });
        });

        it('should return null when age is below the maximum', () => {
            const today = new Date();
            const dob = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            expect(validator(control)).toBeNull();
        });

        it('should return null when age is exactly the maximum', () => {
            const today = new Date();
            const dob = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            expect(validator(control)).toBeNull();
        });

        it('should return maxAge error when age exceeds maximum', () => {
            const today = new Date();
            const dob = new Date(today.getFullYear() - 130, today.getMonth(), today.getDate());
            const control = new FormControl(dob.toISOString().split('T')[0]);
            const result = validator(control);
            expect(result).toBeTruthy();
            expect(result!['maxAge']).toBeTruthy();
            expect(result!['maxAge'].requiredAge).toBe(120);
            expect(result!['maxAge'].actualAge).toBe(130);
        });

        it('should work with a small max age', () => {
            const v = CustomValidators.maxAgeValidator(10);
            const today = new Date();
            const dob = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
            expect(v(new FormControl(dob.toISOString().split('T')[0]))).toBeNull();
        });
    });

    // ==================== passwordMatchValidator ====================

    describe('passwordMatchValidator', () => {
        it('should set mustMatch errors when passwords do not match', () => {
            const form = new FormGroup({
                password: new FormControl('abc123'),
                confirmPassword: new FormControl('xyz789'),
            });

            const validator = CustomValidators.passwordMatchValidator(
                'password',
                'confirmPassword'
            );
            validator(form);

            expect(form.get('password')!.hasError('mustMatch')).toBeTrue();
            expect(form.get('confirmPassword')!.hasError('mustMatch')).toBeTrue();
        });

        it('should clear errors when passwords match', () => {
            const form = new FormGroup({
                password: new FormControl('abc123'),
                confirmPassword: new FormControl('abc123'),
            });

            const validator = CustomValidators.passwordMatchValidator(
                'password',
                'confirmPassword'
            );
            validator(form);

            expect(form.get('password')!.errors).toBeNull();
            expect(form.get('confirmPassword')!.errors).toBeNull();
        });

        it('should clear errors when changed from mismatch to match', () => {
            const form = new FormGroup({
                password: new FormControl('abc'),
                confirmPassword: new FormControl('xyz'),
            });

            const validator = CustomValidators.passwordMatchValidator(
                'password',
                'confirmPassword'
            );

            // First call: mismatch
            validator(form);
            expect(form.get('password')!.hasError('mustMatch')).toBeTrue();

            // Update to match
            form.get('password')!.setValue('xyz');
            validator(form);
            expect(form.get('password')!.errors).toBeNull();
            expect(form.get('confirmPassword')!.errors).toBeNull();
        });

        it('should match when both are empty strings', () => {
            const form = new FormGroup({
                password: new FormControl(''),
                confirmPassword: new FormControl(''),
            });

            const validator = CustomValidators.passwordMatchValidator(
                'password',
                'confirmPassword'
            );
            validator(form);

            expect(form.get('password')!.errors).toBeNull();
            expect(form.get('confirmPassword')!.errors).toBeNull();
        });
    });

    // ==================== phoneValidator ====================

    describe('phoneValidator', () => {
        const validator = CustomValidators.phoneValidator();

        it('should return null for null value (optional)', () => {
            expect(validator(new FormControl(null))).toBeNull();
        });

        it('should return null for empty string (optional)', () => {
            expect(validator(new FormControl(''))).toBeNull();
        });

        it('should return null for a valid international phone number', () => {
            expect(validator(new FormControl('+1234567890'))).toBeNull();
        });

        it('should return null for a valid number without plus', () => {
            expect(validator(new FormControl('1234567890'))).toBeNull();
        });

        it('should return null for a number with country code', () => {
            expect(validator(new FormControl('+447911123456'))).toBeNull();
        });

        it('should return { invalidPhone: true } for letters', () => {
            expect(validator(new FormControl('abcdefgh'))).toEqual({ invalidPhone: true });
        });

        it('should return { invalidPhone: true } for mixed letters and digits', () => {
            expect(validator(new FormControl('123abc456'))).toEqual({ invalidPhone: true });
        });

        it('should return { invalidPhone: true } for leading zero', () => {
            // regex ^\\+?[1-9] requires first digit to be 1-9
            expect(validator(new FormControl('0123456789'))).toEqual({ invalidPhone: true });
        });

        it('should return { invalidPhone: true } for spaces in number', () => {
            expect(validator(new FormControl('+1 234 567'))).toEqual({ invalidPhone: true });
        });

        it('should return { invalidPhone: true } for dashes', () => {
            expect(validator(new FormControl('123-456-7890'))).toEqual({ invalidPhone: true });
        });

        it('should return { invalidPhone: true } for too long a number', () => {
            // E.164 max is 15 digits, regex allows up to 15 digits
            expect(validator(new FormControl('+1234567890123456'))).toEqual({
                invalidPhone: true,
            });
        });

        it('should return null for exactly 15-digit number with plus', () => {
            expect(validator(new FormControl('+123456789012345'))).toBeNull();
        });

        it('should return { invalidPhone: true } for just a plus sign', () => {
            expect(validator(new FormControl('+'))).toEqual({ invalidPhone: true });
        });

        it('should return { invalidPhone: true } for special characters', () => {
            expect(validator(new FormControl('(123) 456-7890'))).toEqual({ invalidPhone: true });
        });
    });

    // ==================== notOwnEmailValidator ====================

    describe('notOwnEmailValidator', () => {
        const userEmail = 'me@example.com';
        const validator = CustomValidators.notOwnEmailValidator(userEmail);

        it('should return null for null value (optional)', () => {
            expect(validator(new FormControl(null))).toBeNull();
        });

        it('should return null for empty string (optional)', () => {
            expect(validator(new FormControl(''))).toBeNull();
        });

        it('should return { ownEmail: true } when entering own email', () => {
            expect(validator(new FormControl('me@example.com'))).toEqual({ ownEmail: true });
        });

        it('should return { ownEmail: true } regardless of case', () => {
            expect(validator(new FormControl('ME@EXAMPLE.COM'))).toEqual({ ownEmail: true });
        });

        it('should return { ownEmail: true } with surrounding whitespace', () => {
            expect(validator(new FormControl('  me@example.com  '))).toEqual({ ownEmail: true });
        });

        it('should return null for a different email', () => {
            expect(validator(new FormControl('other@example.com'))).toBeNull();
        });

        it('should return null for a similar but different email', () => {
            expect(validator(new FormControl('me@example.org'))).toBeNull();
        });

        it('should handle validator created with uppercase email', () => {
            const v = CustomValidators.notOwnEmailValidator('ADMIN@Test.Com');
            expect(v(new FormControl('admin@test.com'))).toEqual({ ownEmail: true });
        });

        it('should handle validator created with whitespace-padded email', () => {
            const v = CustomValidators.notOwnEmailValidator('  user@test.com  ');
            expect(v(new FormControl('user@test.com'))).toEqual({ ownEmail: true });
        });
    });
});
