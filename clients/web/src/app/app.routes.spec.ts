import { routes } from './app.routes';

type LazyRoute = {
  path?: string;
  loadComponent?: () => Promise<unknown>;
  children?: LazyRoute[];
};

function findChildRoute(path: string): LazyRoute | undefined {
  const appRoute = routes.find((route) => route.path === 'app');
  return appRoute?.children?.find((child) => child.path === path) as LazyRoute | undefined;
}

describe('app routes', () => {
  it('lazy-loads entity list route', async () => {
    const route = findChildRoute('entity/:code');
    expect(route?.loadComponent).toBeDefined();
    const component = await route!.loadComponent!();
    expect(component).toBeTruthy();
  });

  it('lazy-loads entity record routes', async () => {
    const newRoute = findChildRoute('entity/:code/new');
    const detailRoute = findChildRoute('entity/:code/:recordId');
    expect(newRoute?.loadComponent).toBeDefined();
    expect(detailRoute?.loadComponent).toBeDefined();
    const newComponent = await newRoute!.loadComponent!();
    const detailComponent = await detailRoute!.loadComponent!();
    expect(newComponent).toBe(detailComponent);
  });

  it('lazy-loads notifications and account routes', async () => {
    const notifications = findChildRoute('notifications');
    const account = findChildRoute('account');
    expect(notifications?.loadComponent).toBeDefined();
    expect(account?.loadComponent).toBeDefined();
    await expectAsync(notifications!.loadComponent!()).toBeResolved();
    await expectAsync(account!.loadComponent!()).toBeResolved();
  });
});
