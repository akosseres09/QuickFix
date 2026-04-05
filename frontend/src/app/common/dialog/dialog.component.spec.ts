import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogComponent, DialogData } from './dialog.component';

describe('DialogComponent', () => {
    let component: DialogComponent;
    let fixture: ComponentFixture<DialogComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<DialogComponent>>;

    const mockData: DialogData = {
        title: 'Test Dialog',
        content: null as any,
    };

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [DialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { ...mockData } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('constructor defaults', () => {
        it('should set default saveLabel', () => {
            expect(component.data.saveLabel).toBe('Save');
        });

        it('should set default cancelLabel', () => {
            expect(component.data.cancelLabel).toBe('Cancel');
        });

        it('should show save button by default', () => {
            expect(component.data.showSaveButton).toBeTrue();
        });

        it('should show cancel button by default', () => {
            expect(component.data.showCancelButton).toBeTrue();
        });

        it('should not have save disabled by default', () => {
            expect(component.data.saveDisabled).toBeFalse();
        });
    });

    describe('onCancel', () => {
        it('should close the dialog with null', () => {
            component.onCancel();
            expect(mockDialogRef.close).toHaveBeenCalledWith(null);
        });
    });

    describe('onSave', () => {
        it('should close the dialog with action save', () => {
            component.onSave();
            expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'save' });
        });
    });

    describe('template', () => {
        it('should display the title', () => {
            const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
            expect(title.textContent).toContain('Test Dialog');
        });

        it('should render the save button', () => {
            const buttons = fixture.nativeElement.querySelectorAll('button');
            const saveBtn = Array.from(buttons).find((b: any) => b.textContent.includes('Save'));
            expect(saveBtn).toBeTruthy();
        });

        it('should render the cancel button', () => {
            const buttons = fixture.nativeElement.querySelectorAll('button');
            const cancelBtn = Array.from(buttons).find((b: any) =>
                b.textContent.includes('Cancel')
            );
            expect(cancelBtn).toBeTruthy();
        });
    });

    describe('with custom options', () => {
        it('should hide save button when showSaveButton is false', async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [DialogComponent],
                providers: [
                    { provide: MatDialogRef, useValue: mockDialogRef },
                    { provide: MAT_DIALOG_DATA, useValue: { ...mockData, showSaveButton: false } },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(DialogComponent);
            f.detectChanges();
            const el: HTMLElement = f.nativeElement;
            expect(el.textContent).not.toContain('Save');
        });
    });
});
