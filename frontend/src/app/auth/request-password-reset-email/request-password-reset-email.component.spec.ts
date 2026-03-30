import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestPasswordResetEmailComponent } from './request-password-reset-email.component';

describe('RequestPasswordResetEmailComponent', () => {
  let component: RequestPasswordResetEmailComponent;
  let fixture: ComponentFixture<RequestPasswordResetEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestPasswordResetEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestPasswordResetEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
