import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '../services/i18n.service';
import { DetailPlaceholderComponent } from './detail-placeholder.component';

describe('DetailPlaceholderComponent', () => {
  let fixture: ComponentFixture<DetailPlaceholderComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPlaceholderComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailPlaceholderComponent);
    i18n = TestBed.inject(I18nService);
  });

  it('shows empty-state with create action by default', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(i18n.t('entity.selectPlaceholder'));
    expect(fixture.nativeElement.textContent).toContain(i18n.t('entity.new'));
  });

  it('emits createRecord when empty-state action is clicked', () => {
    fixture.detectChanges();

    const emitted: void[] = [];
    fixture.componentInstance.createRecord.subscribe(() => emitted.push());

    const btn = fixture.nativeElement.querySelector('app-empty-state button') as HTMLButtonElement;
    btn.click();
    expect(emitted.length).toBe(1);
  });

  it('shows read-only placeholder when create action is hidden', () => {
    fixture.componentInstance.showCreateAction = false;
    fixture.componentInstance.message = 'Pick a row';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Pick a row');
  });
});
