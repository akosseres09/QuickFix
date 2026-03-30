import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProjectFormComponent } from './project-form.component';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ProjectPriority, ProjectStatus, ProjectVisibility } from '../../../shared/model/Project';

describe('ProjectFormComponent', () => {
    let component: ProjectFormComponent;
    let fixture: ComponentFixture<ProjectFormComponent>;

    const mockAuthService = {
        currentUserClaims: signal({
            uid: 'user-1',
            email: 'test@test.com',
            role: { name: 'admin', value: 1 },
        }),
        isLoggedIn: signal(true),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProjectFormComponent, NoopAnimationsModule],
            providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
        }).compileComponents();

        fixture = TestBed.createComponent(ProjectFormComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('organizationId', 'org-1');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('form initialization', () => {
        it('should create the form with all controls', () => {
            expect(component.projectForm).toBeTruthy();
            expect(component.projectForm.get('name')).toBeTruthy();
            expect(component.projectForm.get('key')).toBeTruthy();
            expect(component.projectForm.get('description')).toBeTruthy();
            expect(component.projectForm.get('visibility')).toBeTruthy();
            expect(component.projectForm.get('status')).toBeTruthy();
            expect(component.projectForm.get('priority')).toBeTruthy();
        });

        it('should initialize with defaults when no project input', () => {
            expect(component.projectForm.get('name')!.value).toBe('');
            expect(component.projectForm.get('key')!.value).toBe('');
            expect(component.projectForm.get('visibility')!.value).toBe(ProjectVisibility.PRIVATE);
            expect(component.projectForm.get('status')!.value).toBe(ProjectStatus.ACTIVE);
            expect(component.projectForm.get('priority')!.value).toBe(ProjectPriority.MEDIUM);
        });
    });

    describe('form validation', () => {
        it('should require name', () => {
            component.projectForm.get('name')!.setValue('');
            expect(component.projectForm.get('name')!.hasError('required')).toBeTrue();
        });

        it('should enforce name max length of 255', () => {
            component.projectForm.get('name')!.setValue('a'.repeat(256));
            expect(component.projectForm.get('name')!.hasError('maxlength')).toBeTrue();
        });

        it('should require key', () => {
            component.projectForm.get('key')!.setValue('');
            expect(component.projectForm.get('key')!.hasError('required')).toBeTrue();
        });

        it('should enforce key max length of 10', () => {
            component.projectForm.get('key')!.setValue('ABCDEFGHIJK');
            expect(component.projectForm.get('key')!.hasError('maxlength')).toBeTrue();
        });

        it('should enforce key pattern (uppercase alphanumeric)', () => {
            component.projectForm.get('key')!.setValue('abc');
            expect(component.projectForm.get('key')!.hasError('pattern')).toBeTrue();
        });

        it('should accept valid key', () => {
            component.projectForm.get('key')!.setValue('PROJ-1');
            expect(component.projectForm.get('key')!.valid).toBeTrue();
        });

        it('should require visibility', () => {
            component.projectForm.get('visibility')!.setValue('');
            expect(component.projectForm.get('visibility')!.hasError('required')).toBeTrue();
        });
    });

    describe('auto key generation', () => {
        it('should auto-generate key from name', () => {
            component.projectForm.get('name')!.setValue('My Project');
            expect(component.projectForm.get('key')!.value).toBe('MYPROJECT');
        });

        it('should strip non-alphanumeric chars from key', () => {
            component.projectForm.get('name')!.setValue('Test @#$ Project!');
            expect(component.projectForm.get('key')!.value).toBe('TESTPROJEC');
        });

        it('should truncate key to 10 characters', () => {
            component.projectForm.get('name')!.setValue('A Very Long Project Name');
            expect(component.projectForm.get('key')!.value.length).toBeLessThanOrEqual(10);
        });
    });

    describe('label methods', () => {
        it('getPriorityLabel should return correct labels', () => {
            expect(component.getPriorityLabel(ProjectPriority.LOW)).toBe('Low');
            expect(component.getPriorityLabel(ProjectPriority.MEDIUM)).toBe('Medium');
            expect(component.getPriorityLabel(ProjectPriority.HIGH)).toBe('High');
            expect(component.getPriorityLabel(ProjectPriority.CRITICAL)).toBe('Critical');
            expect(component.getPriorityLabel(99)).toBe('Unknown');
        });

        it('getStatusLabel should format status strings', () => {
            expect(component.getStatusLabel('active')).toBe('Active');
            expect(component.getStatusLabel('on_hold')).toBe('On Hold');
        });

        it('getVisibilityLabel should capitalize first letter', () => {
            expect(component.getVisibilityLabel('public')).toBe('Public');
            expect(component.getVisibilityLabel('private')).toBe('Private');
        });
    });

    describe('onSubmit', () => {
        it('should emit formSubmitted for valid form', () => {
            const spy = spyOn(component.formSubmitted, 'emit');
            component.projectForm.get('name')!.setValue('Test');
            component.projectForm.get('key')!.setValue('TEST');

            component.onSubmit();

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    name: 'Test',
                    key: 'TEST',
                    ownerId: 'user-1',
                })
            );
        });

        it('should set isSubmitting on valid submit', () => {
            component.projectForm.get('name')!.setValue('Test');
            component.projectForm.get('key')!.setValue('TEST');
            component.onSubmit();
            expect(component.isSubmitting()).toBeTrue();
        });

        it('should not emit when form is invalid', () => {
            const spy = spyOn(component.formSubmitted, 'emit');
            component.projectForm.get('name')!.setValue('');
            component.onSubmit();
            expect(spy).not.toHaveBeenCalled();
        });

        it('should mark all as touched when invalid', () => {
            component.projectForm.get('name')!.setValue('');
            component.onSubmit();
            expect(component.projectForm.get('name')!.touched).toBeTrue();
        });
    });

    describe('template', () => {
        it('should render a form element', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('form')).toBeTruthy();
        });

        it('should render submit button with default text', () => {
            const el: HTMLElement = fixture.nativeElement;
            const btn = el.querySelector('button[type="submit"]');
            expect(btn?.textContent).toContain('Create Project');
        });

        it('should render cancel link', () => {
            const el: HTMLElement = fixture.nativeElement;
            const cancel = el.querySelector('a[mat-button]');
            expect(cancel?.textContent).toContain('Cancel');
        });
    });
});
