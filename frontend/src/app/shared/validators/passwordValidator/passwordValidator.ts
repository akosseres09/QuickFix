import { FormGroup, ValidationErrors } from '@angular/forms';

export function passwordMatchValidator(controlName: string, mactchingControlName: string) {
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
