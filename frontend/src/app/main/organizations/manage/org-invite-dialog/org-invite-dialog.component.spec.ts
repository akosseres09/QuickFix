import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgInviteDialogComponent } from './org-invite-dialog.component';

describe('OrgInviteDialogComponent', () => {
  let component: OrgInviteDialogComponent;
  let fixture: ComponentFixture<OrgInviteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgInviteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgInviteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
