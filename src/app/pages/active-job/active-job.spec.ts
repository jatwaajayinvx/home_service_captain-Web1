import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveJob } from './active-job';

describe('ActiveJob', () => {
  let component: ActiveJob;
  let fixture: ComponentFixture<ActiveJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveJob],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveJob);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
