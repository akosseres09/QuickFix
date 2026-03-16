import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelFormDialogComponent } from './label-form-dialog.component';

describe('LabelFormDialogComponent', () => {
  let component: LabelFormDialogComponent;
  let fixture: ComponentFixture<LabelFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabelFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
