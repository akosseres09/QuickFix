import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelDeleteDialogComponent } from './label-delete-dialog.component';

describe('LabelDeleteDialogComponent', () => {
  let component: LabelDeleteDialogComponent;
  let fixture: ComponentFixture<LabelDeleteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelDeleteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabelDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
