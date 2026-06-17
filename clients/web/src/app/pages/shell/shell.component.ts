import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AppLayoutComponent } from '../../shared/layout/app-layout.component';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { ShellContextService } from '../../shared/services/shell-context.service';
import { resolvePageTitle } from '../../shared/utils/page-title.util';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `
    <app-app-layout
      [pageTitle]="pageTitle"
      [tenantLine]="shellContext.tenantLine()"
      [multiTenant]="shellContext.multiTenant()"
      [selectedTenant]="shellContext.selectedTenant()"
      [tenants]="shellContext.tenants()"
      [platformLinks]="shellContext.platformLinks()"
      [navGroups]="shellContext.navGroups()"
      [navLoadError]="shellContext.navLoadError()"
      [navEmpty]="shellContext.navEmpty()"
      [isMobile]="isMobile"
      [sidenavOpened]="sidenavOpened"
      (tenantChange)="shellContext.selectTenant($event)"
      (navRetry)="onNavRetry()"
      (signOut)="auth.logout()"
    />
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly shellContext = inject(ShellContextService);
  private readonly i18n = inject(I18nService);
  private readonly layout = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'EMCAP';
  isMobile = false;
  sidenavOpened = true;

  ngOnInit(): void {
    this.layout.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((mobile) => {
      this.isMobile = mobile;
      this.sidenavOpened = !mobile;
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.refreshPageTitle();
      });

    void this.shellContext.load().then(() => this.refreshPageTitle());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNavRetry(): void {
    void this.shellContext.load().then(() => this.refreshPageTitle());
  }

  private refreshPageTitle(): void {
    this.pageTitle = resolvePageTitle(
      this.router.url,
      this.shellContext.platformLinks(),
      this.shellContext.menus(),
      (key) => this.i18n.t(key),
    );
  }
}
