import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import type { ModuleNavGroup, PlatformNavLink } from '../../services/shell-nav.util';
import { I18nService, type AppLocale } from '../services/i18n.service';
import { ThemeService } from '../services/theme.service';
import { SidenavNavComponent } from '../navigation/sidenav-nav.component';
import { TenantSelectComponent } from '../navigation/tenant-select.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    SidenavNavComponent,
    TenantSelectComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);

  @Input() pageTitle = 'EMCAP';
  @Input() tenantLine = '';
  @Input() multiTenant = false;
  @Input() selectedTenant = 'default';
  @Input() tenants: Record<string, unknown>[] = [];
  @Input() platformLinks: PlatformNavLink[] = [];
  @Input() navGroups: ModuleNavGroup[] = [];
  @Input() isMobile = false;
  @Input() sidenavOpened = true;

  @Output() tenantChange = new EventEmitter<string>();
  @Output() signOut = new EventEmitter<void>();

  @ViewChild('drawer') drawer?: MatSidenav;

  onNavClick(): void {
    if (this.isMobile) {
      void this.drawer?.close();
    }
  }

  onLocaleChange(value: AppLocale): void {
    this.i18n.setLocale(value);
  }
}
