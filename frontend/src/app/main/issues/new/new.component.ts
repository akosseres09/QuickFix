import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField } from '../../../shared/constants/FormField';
import { FormComponent } from '../../../common/form/form.component';

@Component({
    selector: 'app-new',
    imports: [CommonModule, ReactiveFormsModule, FormComponent],
    templateUrl: './new.component.html',
    styleUrl: './new.component.css',
})
export class NewComponent implements OnInit {
    router = inject(Router);
    snackbarService = inject(SnackbarService);
    issueService = inject(IssueService);
    fields: Array<FormField> = [
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            value: '',
            required: true,
            validators: [Validators.required, Validators.maxLength(512)],
            errorText: new Map<string, string>([
                ['required', 'Title is required'],
                ['maxlength', 'Title cannot exceed 512 characters'],
            ]),
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            value: '',
            required: true,
            validators: [Validators.required, Validators.maxLength(4096)],
            errorText: new Map<string, string>([
                ['required', 'Description is required'],
                ['maxlength', 'Description cannot exceed 4096 characters'],
            ]),
        },
    ];

    ngOnInit(): void {}

    submit(data: any) {
        this.snackbarService.open('Issue Created!');
        this.router.navigateByUrl('/issues');
    }

    cancel() {
        this.router.navigateByUrl('/issues');
    }
}
