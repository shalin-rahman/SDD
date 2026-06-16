import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { MenuItem } from '../../api/emcap-client';
import type { ModuleNavGroup } from '../../services/shell-nav.util';
import { SidenavNavComponent } from './sidenav-nav.component';

describe('SidenavNavComponent', () => {
  let fixture: ComponentFixture<SidenavNavComponent>;

  const inventoryMenus: MenuItem[] = [
    {
      code: 'products',
      label: 'Products',
      entity_code: 'PRODUCT',
      module: 'INVENTORY',
      icon: 'inventory_2',
    },
    {
      code: 'warehouses',
      label: 'Warehouses',
      entity_code: 'WAREHOUSE',
      module: 'INVENTORY',
      icon: 'warehouse',
    },
  ];

  const navGroups: ModuleNavGroup[] = [
    {
      moduleCode: 'INVENTORY',
      moduleLabel: 'Inventory',
      items: inventoryMenus,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidenavNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavNavComponent);
    fixture.componentInstance.navGroups = navGroups;
    fixture.componentInstance.platformLinks = [
      { label: 'Reports', route: '/app/reports', visible: true },
    ];
  });

  it('renders Material icons for module menu items', () => {
    fixture.detectChanges();

    const icons = Array.from(
      fixture.nativeElement.querySelectorAll('mat-icon'),
    ) as HTMLElement[];
    const iconNames = icons.map((el) => el.textContent?.trim());

    expect(iconNames).toContain('inventory_2');
    expect(iconNames).toContain('warehouse');
  });

  it('translates platform link labels via labelKey', () => {
    fixture.componentInstance.platformLinks = [
      { labelKey: 'platform.reports.title', label: 'Reports', route: '/app/reports', visible: true },
    ];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reports');
  });

  it('falls back to description icon when menu item has no icon', () => {
    fixture.componentInstance.navGroups = [
      {
        moduleCode: 'CRM',
        moduleLabel: 'Crm',
        items: [
          {
            code: 'leads',
            label: 'Leads',
            entity_code: 'LEAD',
            module: 'CRM',
          },
        ],
      },
    ];
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon') as HTMLElement;
    expect(icon.textContent?.trim()).toBe('description');
  });
});
