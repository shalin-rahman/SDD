import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ShellComponent } from './shell.component';
import { LayoutService } from '../../shared/services/layout.service';
import { ShellContextService } from '../../shared/services/shell-context.service';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let routerEvents$: Subject<NavigationEnd>;

  beforeEach(async () => {
    routerEvents$ = new Subject<NavigationEnd>();
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { logout: jasmine.createSpy('logout') },
        },
        {
          provide: LayoutService,
          useValue: { isMobile$: new Subject<boolean>().asObservable() },
        },
        {
          provide: ShellContextService,
          useValue: {
            load: jasmine.createSpy('load').and.resolveTo(undefined),
            tenantLine: () => 'Default tenant',
            multiTenant: () => false,
            selectedTenant: () => 'default',
            tenants: () => [],
            platformLinks: () => [],
            navGroups: () => [],
            menus: () => [],
            selectTenant: jasmine.createSpy('selectTenant'),
          },
        },
        {
          provide: Router,
          useValue: {
            url: '/app/entity/PRODUCT',
            events: routerEvents$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
  });

  it('loads shell context and sets page title from route', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const shell = TestBed.inject(ShellContextService);
    expect(shell.load).toHaveBeenCalled();
    expect(fixture.componentInstance.pageTitle).toContain('PRODUCT');
  });

  it('updates page title on navigation end', () => {
    fixture.detectChanges();
    routerEvents$.next(new NavigationEnd(1, '/app/settings', '/app/settings'));
    expect(fixture.componentInstance.pageTitle).toBeTruthy();
  });
});
