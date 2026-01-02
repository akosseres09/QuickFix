import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-worktime-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
    ],
    templateUrl: './worktime-dialog.component.html',
    styleUrl: './worktime-dialog.component.css',
})
export class WorktimeDialogComponent {
    @Input() issueIds: number[] = [];
    @ViewChild('worktimeFormTemplate') worktimeFormTemplate!: TemplateRef<any>;

    worktimeForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.worktimeForm = this.fb.group({
            issueId: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
            date: [new Date(), Validators.required],
            hours: ['', [Validators.required, Validators.min(0.1), Validators.max(24)]],
            description: ['', [Validators.required, Validators.maxLength(500)]],
        });
    }

    saveWorktime() {
        if (!this.worktimeForm.valid) return;
    }
}
