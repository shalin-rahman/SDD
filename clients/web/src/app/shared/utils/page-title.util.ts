import type { PlatformNavLink } from '../../services/shell-nav.util';

export type PageTitleTranslate = (key: string) => string;

function platformLinkTitle(link: PlatformNavLink, translate: PageTitleTranslate): string {
  if (link.labelKey) {
    const translated = translate(link.labelKey);
    return translated === link.labelKey ? link.label : translated;
  }
  return link.label;
}

export function resolvePageTitle(
  url: string,
  platformLinks: PlatformNavLink[],
  menus: { entity_code: string; label: string; report_code?: string }[],
  translate?: PageTitleTranslate,
): string {
  const t = translate ?? ((key: string) => key);

  if (url.includes('/app/reports')) {
    const codeMatch = /[?&]code=([^&]+)/.exec(url);
    if (codeMatch) {
      const code = decodeURIComponent(codeMatch[1]);
      const reportMenu = menus.find((entry) => entry.report_code === code);
      return reportMenu?.label ?? code;
    }
    const platform = platformLinks.find((link) => url.startsWith(link.route));
    if (platform) {
      return platformLinkTitle(platform, t);
    }
    return t('platform.reports.title');
  }

  const platform = platformLinks.find((link) => url.startsWith(link.route));
  if (platform) {
    return platformLinkTitle(platform, t);
  }

  const entityMatch = /\/app\/entity\/([^/?]+)/.exec(url);
  if (entityMatch) {
    const code = entityMatch[1];
    const menu = menus.find((entry) => entry.entity_code === code);
    return menu?.label ?? code;
  }

  return t('shell.pageTitle.default');
}

export function entityRoute(entityCode: string): string[] {
  return ['/app/entity', entityCode];
}

export function menuRoute(item: { entity_code: string; report_code?: string }): string[] {
  if (item.report_code) {
    return ['/app/reports'];
  }
  return entityRoute(item.entity_code);
}

export function menuQueryParams(item: { report_code?: string }): Record<string, string> | null {
  if (item.report_code) {
    return { code: item.report_code };
  }
  return null;
}
