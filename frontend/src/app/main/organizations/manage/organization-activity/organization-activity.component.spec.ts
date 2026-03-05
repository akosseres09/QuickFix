import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationActivityComponent } from './organization-activity.component';

describe('OrganizationActivityComponent', () => {
  let component: OrganizationActivityComponent;
  let fixture: ComponentFixture<OrganizationActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
