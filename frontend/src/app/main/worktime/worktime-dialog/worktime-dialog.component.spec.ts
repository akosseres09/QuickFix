import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorktimeDialogComponent } from './worktime-dialog.component';

describe('WorktimeDialogComponent', () => {
  let component: WorktimeDialogComponent;
  let fixture: ComponentFixture<WorktimeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorktimeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorktimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
