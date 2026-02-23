import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCommentComponent } from './view-comment.component';

describe('ViewCommentComponent', () => {
  let component: ViewCommentComponent;
  let fixture: ComponentFixture<ViewCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewCommentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
