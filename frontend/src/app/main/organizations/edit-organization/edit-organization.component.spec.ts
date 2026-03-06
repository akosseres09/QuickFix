import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOrganizationComponent } from './edit-organization.component';

describe('EditOrganizationComponent', () => {
    let component: EditOrganizationComponent;
    let fixture: ComponentFixture<EditOrganizationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditOrganizationComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditOrganizationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
