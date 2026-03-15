import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationMemberItemComponent } from './organization-member-item.component';

describe('OrganizationMemberItemComponent', () => {
  let component: OrganizationMemberItemComponent;
  let fixture: ComponentFixture<OrganizationMemberItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationMemberItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationMemberItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
