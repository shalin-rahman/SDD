import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFormPanelComponent } from './admin-form-panel.component';

describe('AdminFormPanelComponent', () => {
  let fixture: ComponentFixture<AdminFormPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFormPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFormPanelComponent);
  });

  it('renders title and optional subtitle', () => {
    fixture.componentInstance.title = 'Edit role';
    fixture.componentInstance.subtitle = 'Assign permissions';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3')?.textContent?.trim()).toBe('Edit role');
    expect(fixture.nativeElement.textContent).toContain('Assign permissions');
  });

  it('omits subtitle element when subtitle is empty', () => {
    fixture.componentInstance.title = 'Details';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin-form-panel__subtitle')).toBeNull();
  });
});
