import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';

import type { ModuleNavGroup, PlatformNavLink } from '../../services/shell-nav.util';
import { entityRoute, menuQueryParams, menuRoute } from '../utils/page-title.util';

@Component({
  selector: 'app-sidenav-nav',
  standalone: true,
  imports: [RouterModule, MatListModule],
  templateUrl: './sidenav-nav.component.html',
  styleUrl: './sidenav-nav.component.scss',
})
export class SidenavNavComponent {
  @Input() platformLinks: PlatformNavLink[] = [];
  @Input() navGroups: ModuleNavGroup[] = [];
  @Output() navClick = new EventEmitter<void>();

  readonly entityRoute = entityRoute;
  readonly menuRoute = menuRoute;
  readonly menuQueryParams = menuQueryParams;

  onClick(): void {
    this.navClick.emit();
  }
}
