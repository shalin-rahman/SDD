import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { EmcapApiService } from '../services/emcap-api.service';
import { hasPermission } from '../services/shell-nav.util';
import { extractUserPermissions } from '../shared/utils/tenant.util';

export const adminGuard: CanActivateFn = async () => {
  const api = inject(EmcapApiService);
  const router = inject(Router);
  try {
    const me = await api.client.getMe();
    const permissions = extractUserPermissions(me);
    if (
      hasPermission(permissions, 'admin.users.read') ||
      hasPermission(permissions, 'admin.roles.read') ||
      hasPermission(permissions, 'admin.settings.read') ||
      hasPermission(permissions, 'admin.security.read') ||
      hasPermission(permissions, 'admin.*')
    ) {
      return true;
    }
  } catch {
    // fall through
  }
  return router.createUrlTree(['/app']);
};

export const settingsGuard: CanActivateFn = async () => {
  const api = inject(EmcapApiService);
  const router = inject(Router);
  try {
    const me = await api.client.getMe();
    const permissions = extractUserPermissions(me);
    if (hasPermission(permissions, 'admin.settings.read') || hasPermission(permissions, 'admin.*')) {
      return true;
    }
  } catch {
    // fall through
  }
  return router.createUrlTree(['/app']);
};
