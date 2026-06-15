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

  it('renders emcap-badge status chip with on/off modifiers', () => {
    fixture.componentInstance.statusLabel = 'Active';
    fixture.componentInstance.statusActive = true;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.emcap-badge--on') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Active');

    fixture.componentInstance.statusActive = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.emcap-badge--off')).toBeTruthy();
  });
});
