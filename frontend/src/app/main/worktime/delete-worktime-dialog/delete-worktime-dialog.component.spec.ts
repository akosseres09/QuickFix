import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteWorktimeDialogComponent } from './delete-worktime-dialog.component';

describe('DeleteWorktimeDialogComponent', () => {
  let component: DeleteWorktimeDialogComponent;
  let fixture: ComponentFixture<DeleteWorktimeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteWorktimeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteWorktimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
