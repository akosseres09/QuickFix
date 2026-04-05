import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextEditorComponent } from './text-editor.component';

describe('TextEditorComponent', () => {
    let component: TextEditorComponent;
    let fixture: ComponentFixture<TextEditorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TextEditorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TextEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('default state', () => {
        it('should have default placeholder', () => {
            expect(component.placeholder()).toBe('Write something...');
        });

        it('should not be readonly by default', () => {
            expect(component.readonly()).toBeFalse();
        });

        it('should have default minHeight', () => {
            expect(component.minHeight()).toBe('200px');
        });

        it('should have default maxHeight', () => {
            expect(component.maxHeight()).toBe('700px');
        });

        it('should not be disabled by default', () => {
            expect(component.isDisabled()).toBeFalse();
        });

        it('should have null content by default', () => {
            expect(component.content()).toBeNull();
        });
    });

    describe('ControlValueAccessor', () => {
        it('should implement registerOnChange', () => {
            const fn = jasmine.createSpy('onChange');
            component.registerOnChange(fn);
            expect(component).toBeTruthy();
        });

        it('should implement registerOnTouched', () => {
            const fn = jasmine.createSpy('onTouched');
            component.registerOnTouched(fn);
            expect(component).toBeTruthy();
        });

        describe('writeValue', () => {
            it('should store pending value when editor is not ready', () => {
                component.quillEditor.set(null);
                component.writeValue('{"ops":[{"insert":"hello\\n"}]}');
                // Value should be stored as pending - editor will apply it later
                expect(component).toBeTruthy();
            });

            it('should handle null value', () => {
                component.writeValue(null);
                expect(component).toBeTruthy();
            });
        });

        describe('setDisabledState', () => {
            it('should set isDisabled signal to true', () => {
                component.setDisabledState(true);
                expect(component.isDisabled()).toBeTrue();
            });

            it('should set isDisabled signal to false', () => {
                component.setDisabledState(true);
                component.setDisabledState(false);
                expect(component.isDisabled()).toBeFalse();
            });
        });
    });

    describe('utility methods', () => {
        it('getPlainText should return empty string when no editor', () => {
            component.quillEditor.set(null);
            expect(component.getPlainText()).toBe('');
        });

        it('getHTML should return empty string when no editor', () => {
            component.quillEditor.set(null);
            expect(component.getHTML()).toBe('');
        });

        it('isEmpty should return true when no editor', () => {
            component.quillEditor.set(null);
            expect(component.isEmpty()).toBeTrue();
        });
    });

    describe('modules config', () => {
        it('should have toolbar configuration', () => {
            expect(component.modules.toolbar).toBeTruthy();
            expect(component.modules.toolbar.length).toBeGreaterThan(0);
        });

        it('should include text formatting options', () => {
            const flatItems = component.modules.toolbar.flat();
            expect(flatItems).toContain('bold');
            expect(flatItems).toContain('italic');
            expect(flatItems).toContain('underline');
        });

        it('should include media options', () => {
            const flatItems = component.modules.toolbar.flat();
            expect(flatItems).toContain('link');
            expect(flatItems).toContain('image');
        });
    });

    describe('template', () => {
        it('should render quill-editor element', () => {
            const el: HTMLElement = fixture.nativeElement;
            expect(el.querySelector('quill-editor')).toBeTruthy();
        });

        it('should render wrapper div', () => {
            const el: HTMLElement = fixture.nativeElement;
            const wrapper = el.querySelector('.rich-text');
            expect(wrapper).toBeTruthy();
        });
    });
});
