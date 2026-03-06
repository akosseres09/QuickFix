import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIssueComponent } from './edit-issue.component';

describe('EditComponent', () => {
    let component: EditIssueComponent;
    let fixture: ComponentFixture<EditIssueComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditIssueComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditIssueComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
