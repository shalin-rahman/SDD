import { Routes } from '@angular/router';

import { adminGuard, settingsGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './pages/shell/shell.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'workflow',
        loadComponent: () =>
          import('./pages/workflow/workflow.component').then((m) => m.WorkflowComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'dashboards',
        loadComponent: () =>
          import('./pages/dashboards/dashboards.component').then((m) => m.DashboardsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./pages/account/account.component').then((m) => m.AccountComponent),
      },
      {
        path: 'assistant',
        loadComponent: () =>
          import('./pages/assistant/assistant.component').then((m) => m.AssistantComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
        canActivate: [settingsGuard],
      },
      {
        path: 'settings/rules',
        loadComponent: () =>
          import('./pages/settings/rule-evaluate.component').then((m) => m.RuleEvaluateComponent),
        canActivate: [settingsGuard],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'users',
            loadComponent: () =>
              import('./pages/admin/admin-users.component').then((m) => m.AdminUsersComponent),
          },
          {
            path: 'roles',
            loadComponent: () =>
              import('./pages/admin/admin-roles.component').then((m) => m.AdminRolesComponent),
          },
          {
            path: 'permissions',
            loadComponent: () =>
              import('./pages/admin/admin-permissions.component').then((m) => m.AdminPermissionsComponent),
          },
          {
            path: 'security',
            loadComponent: () =>
              import('./pages/admin/admin-security.component').then((m) => m.AdminSecurityComponent),
          },
          { path: '', redirectTo: 'users', pathMatch: 'full' },
        ],
      },
      {
        path: 'entity/:code/new',
        loadComponent: () =>
          import('./pages/entity/entity-record.component').then((m) => m.EntityRecordComponent),
      },
      {
        path: 'entity/:code/:recordId',
        loadComponent: () =>
          import('./pages/entity/entity-record.component').then((m) => m.EntityRecordComponent),
      },
      {
        path: 'entity/:code',
        loadComponent: () =>
          import('./pages/entity/entity-list.component').then((m) => m.EntityListComponent),
      },
    ],
  },
];
