import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
    static enum(enumVals: any): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || !control.value?.trim()) {
                return null;
            }

            const validValues = Object.values(enumVals);

            if (!validValues.includes(control.value)) {
                return { invalidValue: true };
            }

            return null;
        };
    }

    static minAgeValidator(minAge: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const birthDate = new Date(control.value);
            const today = new Date();

            // Check if date is valid
            if (isNaN(birthDate.getTime())) {
                return { invalidDate: true };
            }

            // Check if date is in the future
            if (birthDate > today) {
                return { futureDate: true };
            }

            // Calculate age
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age >= minAge ? null : { minAge: { requiredAge: minAge, actualAge: age } };
        };
    }

    static maxAgeValidator(maxAge: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const birthDate = new Date(control.value);
            const today = new Date();

            if (isNaN(birthDate.getTime())) {
                return { invalidDate: true };
            }

            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age <= maxAge ? null : { maxAge: { requiredAge: maxAge, actualAge: age } };
        };
    }

    static passwordMatchValidator(controlName: string, mactchingControlName: string) {
        return (FormGroup: FormGroup) => {
            const control = FormGroup.controls[controlName];
            const matchingControl = FormGroup.controls[mactchingControlName];

            if (control.value !== matchingControl.value) {
                matchingControl.setErrors({ mustMatch: true });
                control.setErrors({ mustMatch: true });
            } else if (
                control.value === matchingControl.value &&
                (!control.errors || !matchingControl.errors)
            ) {
                matchingControl.setErrors(null);
                control.setErrors(null);
            }
        };
    }

    static phoneValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null; // Don't validate empty values to allow optional controls
            }

            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            const valid = phoneRegex.test(control.value);

            return valid ? null : { invalidPhone: true };
        };
    }

    static notOwnEmailValidator(userEmail: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null; // Don't validate empty values to allow optional controls
            }

            const isOwnEmail =
                control.value.trim().toLowerCase() === userEmail.trim().toLowerCase();
            return isOwnEmail ? { ownEmail: true } : null;
        };
    }
}
