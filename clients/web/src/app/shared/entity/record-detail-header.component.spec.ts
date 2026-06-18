import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordDetailHeaderComponent } from './record-detail-header.component';

describe('RecordDetailHeaderComponent', () => {
  let fixture: ComponentFixture<RecordDetailHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordDetailHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordDetailHeaderComponent);
    fixture.componentInstance.headline = 'SKU-001 — Widget';
    fixture.detectChanges();
  });

  it('renders headline and action buttons from inputs', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.record-header__title')?.textContent).toContain('SKU-001');
    expect(el.querySelectorAll('button').length).toBe(0);
  });

  it('renders emcap-badge status chip with on/off modifiers and aria-label', () => {
    fixture.componentInstance.statusLabel = 'Active';
    fixture.componentInstance.statusActive = true;
    fixture.componentInstance.statusAriaLabel = 'Status: Active';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.emcap-badge--on') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Active');
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-label')).toBe('Status: Active');

    fixture.componentInstance.statusActive = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.emcap-badge--off')).toBeTruthy();
  });

  it('renders action buttons when canSave and canDelete are set', () => {
    fixture.componentInstance.canSave = true;
    fixture.componentInstance.canDelete = true;
    fixture.componentInstance.deleteLabel = 'Delete';
    fixture.componentInstance.saveLabel = 'Save';
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(1);
    expect(fixture.nativeElement.textContent).toContain('Delete');
    expect(fixture.nativeElement.textContent).toContain('Save');
  });
});
