import type { PlatformNavLink } from '../../services/shell-nav.util';

export function resolvePageTitle(
  url: string,
  platformLinks: PlatformNavLink[],
  menus: { entity_code: string; label: string }[],
): string {
  const platform = platformLinks.find((link) => url.startsWith(link.route));
  if (platform) {
    return platform.label;
  }

  const entityMatch = /\/app\/entity\/([^/?]+)/.exec(url);
  if (entityMatch) {
    const code = entityMatch[1];
    const menu = menus.find((entry) => entry.entity_code === code);
    return menu?.label ?? code;
  }

  return 'EMCAP';
}

export function entityRoute(entityCode: string): string[] {
  return ['/app/entity', entityCode];
}
