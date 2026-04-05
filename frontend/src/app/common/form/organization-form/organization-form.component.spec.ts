import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { OrganizationFormComponent } from './organization-form.component';

describe('OrganizationFormComponent', () => {
    let component: OrganizationFormComponent;
    let fixture: ComponentFixture<OrganizationFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrganizationFormComponent, NoopAnimationsModule],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(OrganizationFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('form initialization', () => {
        it('should create the form with name, slug, and description', () => {
            expect(component.organizationForm).toBeTruthy();
            expect(component.organizationForm.get('name')).toBeTruthy();
            expect(component.organizationForm.get('slug')).toBeTruthy();
            expect(component.organizationForm.get('description')).toBeTruthy();
        });

        it('should initialize with empty values when no organization input', () => {
            expect(component.name.value).toBe('');
            expect(component.slug.value).toBe('');
            expect(component.description.value).toBe('');
        });

        it('should initialize with organization values when provided', async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [OrganizationFormComponent, NoopAnimationsModule],
                providers: [provideRouter([])],
            }).compileComponents();

            const fix = TestBed.createComponent(OrganizationFormComponent);
            const comp = fix.componentInstance;
            fix.componentRef.setInput('organization', {
                id: '1',
                name: 'Test Org',
                slug: 'test-org',
                description: 'A test organization',
            });
            fix.detectChanges();

            expect(comp.name.value).toBe('Test Org');
            expect(comp.slug.value).toBe('test-org');
            expect(comp.description.value).toBe('A test organization');
        });
    });

    describe('form validation', () => {
        it('should require name', () => {
            component.name.setValue('');
            expect(component.name.hasError('required')).toBeTrue();
        });

        it('should enforce name maxLength of 255', () => {
            component.name.setValue('a'.repeat(256));
            expect(component.name.hasError('maxlength')).toBeTrue();
        });

        it('should require slug', () => {
            component.slug.setValue('');
            expect(component.slug.hasError('required')).toBeTrue();
        });

        it('should enforce slug maxLength of 16', () => {
            component.slug.setValue('a'.repeat(17));
            expect(component.slug.hasError('maxlength')).toBeTrue();
        });

        it('should not require description', () => {
            component.description.setValue('');
            expect(component.description.valid).toBeTrue();
        });
    });

    describe('auto-slug generation', () => {
        it('should generate slug from name', () => {
            component.name.setValue('My New Organization');
            expect(component.slug.value).toBe('my-new-organizat');
        });

        it('should remove special characters from slug', () => {
            component.name.setValue('Test @#$ Org!');
            expect(component.slug.value).toBe('test--org');
        });

        it('should truncate slug to 16 characters', () => {
            component.name.setValue('A Very Long Organization Name That Exceeds Limit');
            expect(component.slug.value.length).toBeLessThanOrEqual(16);
        });
    });

    describe('onSubmit', () => {
        it('should emit formSubmitted for valid form', () => {
            const spy = spyOn(component.formSubmitted, 'emit');
            component.name.setValue('Test Org');
            component.slug.setValue('test-org');
            component.description.setValue('Description');

            component.onSubmit();

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    name: 'Test Org',
                    slug: 'test-org',
                    description: 'Description',
                })
            );
        });

        it('should set isSubmitting on valid submit', () => {
            component.name.setValue('Test');
            component.slug.setValue('test');
            component.onSubmit();
            expect(component.isSubmitting()).toBeTrue();
        });

        it('should not emit when form is invalid', () => {
            const spy = spyOn(component.formSubmitted, 'emit');
            component.name.setValue('');
            component.onSubmit();
            expect(spy).not.toHaveBeenCalled();
        });

        it('should mark all fields as touched when invalid', () => {
            component.name.setValue('');
            component.onSubmit();
            expect(component.name.touched).toBeTrue();
            expect(component.slug.touched).toBeTrue();
        });

        it('should include organization id for existing organization', async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [OrganizationFormComponent, NoopAnimationsModule],
                providers: [provideRouter([])],
            }).compileComponents();

            const fix = TestBed.createComponent(OrganizationFormComponent);
            const comp = fix.componentInstance;
            fix.componentRef.setInput('organization', {
                id: 'org-123',
                name: 'Existing',
                slug: 'existing',
                description: '',
            });
            fix.detectChanges();

            const spy = spyOn(comp.formSubmitted, 'emit');
            comp.onSubmit();

            expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'org-123' }));
        });
    });

    describe('default inputs', () => {
        it('should default buttonText to Create Organization', () => {
            expect(component.buttonText()).toBe('Create Organization');
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

        it('should render name and slug inputs', () => {
            const el: HTMLElement = fixture.nativeElement;
            const inputs = el.querySelectorAll('input[matInput]');
            expect(inputs.length).toBe(2);
        });

        it('should render description textarea', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('textarea')).toBeTruthy();
        });

        it('should render submit button with default text', () => {
            const el: HTMLElement = fixture.nativeElement;
            const submitBtn = el.querySelector('button[type="submit"]');
            expect(submitBtn?.textContent).toContain('Create Organization');
        });

        it('should render cancel link', () => {
            const el: HTMLElement = fixture.nativeElement;
            const cancelLink = el.querySelector('a[routerLink]');
            expect(cancelLink?.textContent).toContain('Cancel');
        });
    });
});
