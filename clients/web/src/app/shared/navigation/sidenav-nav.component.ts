import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import type { ModuleNavGroup, PlatformNavLink } from '../../services/shell-nav.util';
import { entityRoute, menuQueryParams, menuRoute } from '../utils/page-title.util';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-sidenav-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatListModule],
  templateUrl: './sidenav-nav.component.html',
  styleUrl: './sidenav-nav.component.scss',
})
export class SidenavNavComponent {
  readonly i18n = inject(I18nService);

  @Input() platformLinks: PlatformNavLink[] = [];
  @Input() navGroups: ModuleNavGroup[] = [];
  @Input() navLoadError = '';
  @Input() navEmpty = false;
  @Output() navClick = new EventEmitter<void>();
  @Output() retryNav = new EventEmitter<void>();

  readonly entityRoute = entityRoute;
  readonly menuRoute = menuRoute;
  readonly menuQueryParams = menuQueryParams;

  linkLabel(link: PlatformNavLink): string {
    return link.labelKey ? this.i18n.t(link.labelKey) : link.label;
  }

  moduleLabel(group: ModuleNavGroup): string {
    const key = `nav.module.${group.moduleCode.toLowerCase()}`;
    const translated = this.i18n.t(key);
    return translated === key ? group.moduleLabel : translated;
  }

  navErrorMessage(): string {
    if (!this.navLoadError) {
      return '';
    }
    const translated = this.i18n.t(this.navLoadError);
    return translated === this.navLoadError ? this.navLoadError : translated;
  }

  onClick(): void {
    this.navClick.emit();
  }
}
