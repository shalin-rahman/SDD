import { Routes } from '@angular/router';

import { adminGuard, settingsGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { AdminPermissionsComponent } from './pages/admin/admin-permissions.component';
import { AdminRolesComponent } from './pages/admin/admin-roles.component';
import { AdminSecurityComponent } from './pages/admin/admin-security.component';
import { AdminUsersComponent } from './pages/admin/admin-users.component';
import { AccountComponent } from './pages/account/account.component';
import { AssistantComponent } from './pages/assistant/assistant.component';
import { DashboardsComponent } from './pages/dashboards/dashboards.component';
import { EntityComponent } from './pages/entity/entity.component';
import { LoginComponent } from './pages/login/login.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { RuleEvaluateComponent } from './pages/settings/rule-evaluate.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ShellComponent } from './pages/shell/shell.component';
import { WorkflowComponent } from './pages/workflow/workflow.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'workflow', component: WorkflowComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'dashboards', component: DashboardsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'account', component: AccountComponent },
      { path: 'assistant', component: AssistantComponent },
      { path: 'settings', component: SettingsComponent, canActivate: [settingsGuard] },
      {
        path: 'settings/rules',
        component: RuleEvaluateComponent,
        canActivate: [settingsGuard],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: 'users', component: AdminUsersComponent },
          { path: 'roles', component: AdminRolesComponent },
          { path: 'permissions', component: AdminPermissionsComponent },
          { path: 'security', component: AdminSecurityComponent },
          { path: '', redirectTo: 'users', pathMatch: 'full' },
        ],
      },
      { path: 'entity/:code', component: EntityComponent },
    ],
  },
];
