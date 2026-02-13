import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import Quill, { Delta } from 'quill';

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
    maxHeight = input<string>('400px');

    // Editor state
    quillEditor = signal<Quill | null>(null);
    isDisabled = signal<boolean>(false);
    content = signal<Delta | null>(null);

    // Quill modules configuration
    modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            // --- Add Image & Video here ---
            ['link', 'image', 'video'],
            // ------------------------------
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ['clean'],
        ],
    };

    // ControlValueAccessor callbacks
    private onChange: (value: string | null) => void = () => {};
    private onTouched: () => void = () => {};

    // Called when editor is created
    onEditorCreated(quill: any): void {
        // Using 'any' for the quill instance here simplifies module access
        this.quillEditor.set(quill);

        // 1. Properly access the Toolbar Module
        const toolbar = quill.getModule('toolbar');

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
}
