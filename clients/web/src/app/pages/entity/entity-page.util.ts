import type { EmcapApiService } from '../../services/emcap-api.service';

export async function loadEntityMenuTitle(api: EmcapApiService, code: string): Promise<string> {
  try {
    const { menus } = await api.client.getMenus();
    const menu = menus.find((m) => m.entity_code === code);
    return menu?.label ?? code;
  } catch {
    return code;
  }
}
