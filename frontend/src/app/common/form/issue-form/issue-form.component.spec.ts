import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal, Component, forwardRef } from '@angular/core';
import { of } from 'rxjs';
import { IssueFormComponent } from './issue-form.component';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ProjectMemberService } from '../../../shared/services/project-member/project-member.service';
import { LabelService } from '../../../shared/services/label.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { IssueType, IssuePriority } from '../../../shared/model/Issue';
import { TextEditorComponent } from '../../text-editor/text-editor.component';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'app-text-editor',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockTextEditorComponent),
            multi: true,
        },
    ],
})
class MockTextEditorComponent implements ControlValueAccessor {
    writeValue() {}
    registerOnChange() {}
    registerOnTouched() {}
}

describe('IssueFormComponent', () => {
    let component: IssueFormComponent;
    let fixture: ComponentFixture<IssueFormComponent>;

    const mockLabels = [
        { id: 'label-1', name: 'Open', color: '#14c93e', description: '', projectId: 'proj-1' },
        { id: 'label-2', name: 'Closed', color: '#cf2a11', description: '', projectId: 'proj-1' },
    ];

    const mockMembers = [
        {
            userId: 'user-1',
            user: { username: 'john' },
            id: 'm1',
            projectId: 'proj-1',
            role: 'member',
        },
        {
            userId: 'user-2',
            user: { username: 'jane' },
            id: 'm2',
            projectId: 'proj-1',
            role: 'member',
        },
    ];

    const mockAuthService = {
        currentUserClaims: signal({
            uid: 'user-1',
            email: 'test@test.com',
            role: { name: 'admin', value: 1 },
        }),
        isLoggedIn: signal(true),
    };

    const mockMemberService = jasmine.createSpyObj('ProjectMemberService', ['getProjectMembers']);
    const mockLabelService = jasmine.createSpyObj('LabelService', ['getLabelsToProject']);
    const mockSnackbar = jasmine.createSpyObj('SnackbarService', ['error', 'success']);

    beforeEach(async () => {
        mockMemberService.getProjectMembers.and.returnValue(of({ items: mockMembers }));
        mockLabelService.getLabelsToProject.and.returnValue(of({ items: mockLabels }));

        await TestBed.configureTestingModule({
            imports: [IssueFormComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: mockAuthService },
                { provide: ProjectMemberService, useValue: mockMemberService },
                { provide: LabelService, useValue: mockLabelService },
                { provide: SnackbarService, useValue: mockSnackbar },
            ],
        })
            .overrideComponent(IssueFormComponent, {
                remove: { imports: [TextEditorComponent] },
                add: { imports: [MockTextEditorComponent] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(IssueFormComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('projectId', 'proj-1');
        fixture.componentRef.setInput('organizationId', 'org-1');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('form initialization', () => {
        it('should create the form with all controls', () => {
            expect(component.issueForm).toBeTruthy();
            expect(component.issueForm.get('title')).toBeTruthy();
            expect(component.issueForm.get('description')).toBeTruthy();
            expect(component.issueForm.get('type')).toBeTruthy();
            expect(component.issueForm.get('statusLabel')).toBeTruthy();
            expect(component.issueForm.get('priority')).toBeTruthy();
            expect(component.issueForm.get('assignedTo')).toBeTruthy();
            expect(component.issueForm.get('dueDate')).toBeTruthy();
        });

        it('should default type to TASK', () => {
            expect(component.issueForm.get('type')!.value).toBe(IssueType.TASK);
        });

        it('should default priority to MEDIUM', () => {
            expect(component.issueForm.get('priority')!.value).toBe(IssuePriority.MEDIUM);
        });
    });

    describe('form validation', () => {
        it('should require title', () => {
            component.issueForm.get('title')!.setValue('');
            expect(component.issueForm.get('title')!.hasError('required')).toBeTrue();
        });

        it('should enforce title max length of 255', () => {
            component.issueForm.get('title')!.setValue('a'.repeat(256));
            expect(component.issueForm.get('title')!.hasError('maxlength')).toBeTrue();
        });

        it('should require type', () => {
            component.issueForm.get('type')!.setValue(null);
            expect(component.issueForm.get('type')!.hasError('required')).toBeTrue();
        });

        it('should require statusLabel', () => {
            component.issueForm.get('statusLabel')!.setValue(null);
            expect(component.issueForm.get('statusLabel')!.hasError('required')).toBeTrue();
        });

        it('should require priority', () => {
            component.issueForm.get('priority')!.setValue(null);
            expect(component.issueForm.get('priority')!.hasError('required')).toBeTrue();
        });
    });

    describe('service calls', () => {
        it('should load labels on init', () => {
            expect(mockLabelService.getLabelsToProject).toHaveBeenCalledWith({
                organizationId: 'org-1',
                projectId: 'proj-1',
            });
        });

        it('should load members on init', () => {
            expect(mockMemberService.getProjectMembers).toHaveBeenCalledWith({
                organizationId: 'org-1',
                projectId: 'proj-1',
            });
        });

        it('should set labels signal from loaded labels', () => {
            expect(component.labels()).toEqual(mockLabels);
        });

        it('should set pickableUsers from loaded members', () => {
            expect(component.pickableUsers().length).toBe(2);
        });

        it('should select first label when creating new issue', () => {
            expect(component.selectedLabel()).toEqual(mockLabels[0]);
        });
    });

    describe('onUserSelected', () => {
        it('should set assignedTo value', () => {
            component.onUserSelected('user-2');
            expect(component.issueForm.get('assignedTo')!.value).toBe('user-2');
        });

        it('should set null for unassign', () => {
            component.onUserSelected(null);
            expect(component.issueForm.get('assignedTo')!.value).toBeNull();
        });
    });

    describe('displayUser', () => {
        it('should return Unassigned for null', () => {
            expect(component.displayUser(null)).toBe('Unassigned');
        });

        it('should return username for known user', () => {
            expect(component.displayUser('user-1')).toBe('john');
        });

        it('should return Unknown User for unknown userId', () => {
            expect(component.displayUser('unknown-id')).toBe('Unknown User');
        });
    });

    describe('onSubmit', () => {
        it('should emit formSubmitted for valid form', () => {
            const spy = spyOn(component.formSubmitted, 'emit');
            component.issueForm.get('title')!.setValue('Bug report');
            component.issueForm.get('type')!.setValue(IssueType.BUG);

            component.onSubmit();

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    title: 'Bug report',
                    type: IssueType.BUG,
                })
            );
        });

        it('should set isSubmitting on valid submit', () => {
            component.issueForm.get('title')!.setValue('Test');
            component.onSubmit();
            expect(component.isSubmitting()).toBeTrue();
        });

        it('should not emit when form is invalid', () => {
            const spy = spyOn(component.formSubmitted, 'emit');
            component.issueForm.get('title')!.setValue('');
            component.onSubmit();
            expect(spy).not.toHaveBeenCalled();
        });

        it('should show snackbar error for invalid form', () => {
            component.issueForm.get('title')!.setValue('');
            component.onSubmit();
            expect(mockSnackbar.error).toHaveBeenCalledWith('Please fill in all required fields');
        });
    });

    describe('default inputs', () => {
        it('should default buttonText to Create Issue', () => {
            expect(component.buttonText()).toBe('Create Issue');
        });

        it('should default icon to add', () => {
            expect(component.icon()).toBe('add');
        });
    });

    describe('template', () => {
        it('should render a form element', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('form')).toBeTruthy();
        });

        it('should render title input', () => {
            const el: HTMLElement = fixture.nativeElement;
            const titleInput = el.querySelector('input[formControlName="title"]');
            expect(titleInput).toBeTruthy();
        });

        it('should render the text editor stub', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('app-text-editor')).toBeTruthy();
        });
    });
});
