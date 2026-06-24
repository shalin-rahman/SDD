import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { I18nService } from '../services/i18n.service';
import { TenantSelectComponent } from './tenant-select.component';

describe('TenantSelectComponent', () => {
  let fixture: ComponentFixture<TenantSelectComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSelectComponent, NoopAnimationsModule],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSelectComponent);
    i18n = TestBed.inject(I18nService);
    fixture.componentInstance.tenants = [
      { id: 'default', name: 'Default Tenant' },
      { id: 'acme', label: 'Acme Corp' },
    ];
    fixture.componentInstance.selectedTenant = 'default';
  });

  it('renders tenant options with resolved labels', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(i18n.t('toolbar.tenant'));
    expect(fixture.nativeElement.textContent).toContain('Default Tenant');
    expect(fixture.nativeElement.textContent).toContain('Acme Corp');
  });

  it('emits tenantChange when selection changes', () => {
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.tenantChange.subscribe((id) => emitted.push(id));
    fixture.componentInstance.onChange('acme');

    expect(emitted).toEqual(['acme']);
  });
});
