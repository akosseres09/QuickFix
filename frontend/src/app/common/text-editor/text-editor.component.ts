import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import Quill, { Delta } from 'quill';
import Toolbar from 'quill/modules/toolbar';

/**
 * Rich text editor component using Quill.
 * Implements ControlValueAccessor for seamless integration with Angular forms.
 *
 * Stores content as JSON Delta format (Quill's internal format).
 *
 * @example
 * <app-text-editor
 *   formControlName="description"
 *   [placeholder]="'Enter description...'"
 *   [minHeight]="'200px'"
 *   [maxHeight]="'400px'"
 * ></app-text-editor>
 */

@Component({
    selector: 'app-text-editor',
    imports: [CommonModule, QuillModule],
    templateUrl: './text-editor.component.html',
    styleUrl: './text-editor.component.css',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextEditorComponent),
            multi: true,
        },
    ],
})
export class TextEditorComponent implements ControlValueAccessor {
    // Inputs
    placeholder = input<string>('Write something...');
    readonly = input<boolean>(false);
    minHeight = input<string>('200px');
    maxHeight = input<string>('700px');

    // Editor state
    quillEditor = signal<Quill | null>(null);
    isDisabled = signal<boolean>(false);
    content = signal<Delta | null>(null);
    private pendingValue: string | null = null;

    // Quill modules configuration
    modules = {
        toolbar: [
            // Text formatting
            ['bold', 'italic', 'underline', 'strike'],

            // Headings
            [{ header: [1, 2, 3, 4, false] }],

            // Block elements
            ['blockquote', 'code-block'],

            // Lists & structure
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],

            // Alignment
            [{ align: [] }],

            // Media
            ['link', 'image'],

            // Utility
            ['clean'],
        ],
    };

    // ControlValueAccessor callbacks
    private onChange: (value: string | null) => void = () => {};
    private onTouched: () => void = () => {};

    // Called when editor is created
    onEditorCreated(quill: Quill): void {
        // Using 'any' for the quill instance here simplifies module access
        this.quillEditor.set(quill);

        // Apply pending value if it exists
        if (this.pendingValue !== null) {
            this.applyValue(this.pendingValue);
            this.pendingValue = null;
        }

        // 1. Properly access the Toolbar Module
        const toolbar = quill.getModule('toolbar') as Toolbar;

        // We check if toolbar exists, though it always should with your config
        if (toolbar) {
            toolbar.addHandler('image', () => {
                // 2. Handle the 'null' range possibility
                const range = quill.getSelection();
                const value = prompt('Please enter the image URL:');

                if (value && value.trim().length > 0) {
                    // If range is null (editor lost focus), insert at the very end (index 0 or length)
                    const index = range ? range.index : quill.getLength();
                    quill.insertEmbed(index, 'image', value, 'user');

                    // Set selection back to after the image for a better user experience
                    quill.setSelection(index + 1);
                }
            });
        }

        // Add tooltips to toolbar buttons and pickers
        this.addToolbarTooltips(quill);

        // Listen to text changes
        quill.on('text-change', () => {
            const delta = quill.getContents();
            // Use length > 1 because Quill adds a newline \n by default
            const isEmpty = quill.getText().trim().length === 0;

            const value = isEmpty ? null : JSON.stringify(delta);
            this.content.set(isEmpty ? null : delta);
            this.onChange(value);
        });

        // Mark as touched on blur
        quill.root.addEventListener('blur', () => {
            this.onTouched();
        });
    }

    // ControlValueAccessor implementation
    writeValue(value: string | null): void {
        const editor = this.quillEditor();
        if (!editor) {
            // Store the value to apply when editor is ready
            this.pendingValue = value;
            return;
        }

        this.applyValue(value);
    }

    private applyValue(value: string | null): void {
        const editor = this.quillEditor();
        if (!editor) {
            return;
        }

        if (!value) {
            editor.setContents(new Delta());
            this.content.set(null);
            return;
        }

        try {
            const deltaData = JSON.parse(value);
            const delta = new Delta(deltaData.ops);
            editor.setContents(delta);
            this.content.set(delta);
        } catch (error) {
            console.error('Failed to parse Quill Delta:', error);
            editor.setContents(new Delta());
            this.content.set(null);
        }
    }

    registerOnChange(fn: (value: string | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
        const editor = this.quillEditor();
        if (editor) {
            editor.enable(!isDisabled);
        }
    }

    // Utility method to get plain text
    getPlainText(): string {
        const editor = this.quillEditor();
        return editor ? editor.getText() : '';
    }

    // Utility method to get HTML (for preview/export)
    getHTML(): string {
        const editor = this.quillEditor();
        return editor ? editor.root.innerHTML : '';
    }

    // Utility method to check if editor is empty
    isEmpty(): boolean {
        return this.getPlainText().trim().length === 0;
    }

    // Add native title tooltips to all toolbar controls
    private addToolbarTooltips(quill: Quill): void {
        const toolbar = quill.getModule('toolbar') as Toolbar;
        const toolbarEl = toolbar.container;
        if (!toolbarEl) return;

        const tooltipMap: Record<string, string> = {
            // Text formatting
            'ql-bold': 'Bold (Ctrl+B)',
            'ql-italic': 'Italic (Ctrl+I)',
            'ql-underline': 'Underline (Ctrl+U)',
            'ql-strike': 'Strikethrough',
            // Block
            'ql-blockquote': 'Blockquote',
            'ql-code-block': 'Code Block',
            // Lists
            'ql-list': 'List',
            'ql-indent': 'Indent',
            // Media
            'ql-link': 'Insert Link',
            'ql-image': 'Insert Image',
            // Utility
            'ql-clean': 'Clear Formatting',
            // Pickers
            'ql-header': 'Heading',
            'ql-align': 'Text Alignment',
            'ql-color': 'Text Color',
            'ql-background': 'Background Color',
        };

        // Buttons
        toolbarEl.querySelectorAll('button').forEach((btn: HTMLElement) => {
            for (const [cls, tip] of Object.entries(tooltipMap)) {
                if (btn.classList.contains(cls)) {
                    // For buttons with a value attribute, append it
                    const val = btn.getAttribute('value');
                    if (val && cls === 'ql-list') {
                        btn.title = val === 'ordered' ? 'Ordered List' : 'Bullet List';
                    } else if (val && cls === 'ql-indent') {
                        btn.title = val === '+1' ? 'Increase Indent' : 'Decrease Indent';
                    } else {
                        btn.title = tip;
                    }
                    break;
                }
            }
        });

        // Pickers (header, align, color, background)
        toolbarEl.querySelectorAll('.ql-picker').forEach((picker: Element) => {
            for (const [cls, tip] of Object.entries(tooltipMap)) {
                if (picker.classList.contains(cls)) {
                    const label = picker.querySelector('.ql-picker-label') as HTMLElement;
                    if (label) label.title = tip;
                    break;
                }
            }
        });
    }
}
