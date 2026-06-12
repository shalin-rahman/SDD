import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { AccountComponent } from './pages/account/account.component';
import { AssistantComponent } from './pages/assistant/assistant.component';
import { DashboardsComponent } from './pages/dashboards/dashboards.component';
import { EntityComponent } from './pages/entity/entity.component';
import { LoginComponent } from './pages/login/login.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ReportsComponent } from './pages/reports/reports.component';
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
      { path: 'entity/:code', component: EntityComponent },
    ],
  },
];
