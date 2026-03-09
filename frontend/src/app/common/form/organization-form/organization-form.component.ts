import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { Organization } from '../../../shared/model/Organization';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-organization-form',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        RouterLink,
        MatInputModule,
    ],
    templateUrl: './organization-form.component.html',
    styleUrl: './organization-form.component.css',
})
export class OrganizationFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    organization = input<Organization | null>(null);
    buttonText = input<string>('Create Organization');
    icon = input<string>('add');
    isSubmitting = signal<boolean>(false);

    formSubmitted = output<Partial<Organization>>();

    organizationForm!: FormGroup;

    ngOnInit(): void {
        this.organizationForm = this.fb.group({
            name: [
                this.organization()?.name ?? '',
                [Validators.required, Validators.maxLength(255)],
            ],
            slug: [
                this.organization()?.slug ?? '',
                [Validators.required, Validators.maxLength(16)],
            ],
            description: [this.organization()?.description ?? ''],
        });

        this.name.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (name) => {
                const slug = name
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                    .substring(0, 16);
                this.organizationForm.get('slug')?.setValue(slug, { emitEvent: false });
            },
            error: (err) => {
                console.error('Error generating slug:', err);
            },
        });
    }

    get name() {
        return this.organizationForm.get('name')!;
    }

    get slug() {
        return this.organizationForm.get('slug')!;
    }

    get description() {
        return this.organizationForm.get('description')!;
    }

    onSubmit() {
        if (this.organizationForm.invalid) {
            this.organizationForm.markAllAsTouched();
            return;
        }

        const org: Partial<Organization> = {
            ...this.organizationForm.value,
        };

        const organization = this.organization();
        if (organization) {
            org.id = organization.id;
        }

        this.isSubmitting.set(true);
        this.formSubmitted.emit(org);
    }
}
