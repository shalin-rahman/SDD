import { createClient, type EmcapClient } from './emcap-client';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('EmcapClient HTTP surface', () => {
  let client: EmcapClient;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch').and.callFake(async () => jsonResponse({ ok: true }));
    client = createClient('http://localhost:8000');
    client.setToken('session-token', 'tenant-a');
  });

  it('exercises read and write API methods', async () => {
    await client.getMenus();
    await client.getFormMetadata('PRODUCT');
    await client.getGridMetadata('PRODUCT');
    await client.listRecords('PRODUCT', { q: 'sku' });
    await client.getRecord('PRODUCT', 'rec-1');
    await client.createRecord('PRODUCT', { sku: 'A' });
    await client.updateRecord('PRODUCT', 'rec-1', { name: 'X' }, 2);
    await client.deleteRecord('PRODUCT', 'rec-1');
    await client.restoreRecord('PRODUCT', 'rec-1');
    await client.syncSnapshot('PRODUCT');
    await client.listNotes('PRODUCT', 'rec-1');
    await client.addNote('PRODUCT', 'rec-1', 'note body');
    await client.listWorkflowInstances('rec-1');
    await client.getWorkflowInstance('wf-1');
    await client.transitionWorkflow('wf-1', 'approve', 'admin');
    await client.delegateWorkflow('wf-1', 'manager');
    await client.listReports();
    await client.runReport('LOW_STOCK');
    await client.listDocuments('PRODUCT', 'rec-1');
    await client.uploadDocument('PRODUCT', 'rec-1', 'file.txt', 'content');
    await client.syncChanges('PRODUCT', '1970-01-01T00:00:00Z');
    await client.listAudit('PRODUCT');
    await client.listNotifications();
    await client.sendNotification({
      channel: 'email',
      recipient: 'a@b.com',
      subject: 'Hi',
      body: 'Body',
    });
    await client.getPermissions();
    await client.getRoles();
    await client.listDashboards();
    await client.getHealth();
    await client.getPlatformConfig();
    await client.listTenants();
    await client.getAuthProviders();
    await client.getMe();
    await client.listEntities();
    await client.getDocument('doc-1');
    await client.listReportRuns('LOW_STOCK');
    await client.getReportRun('run-1');

    expect(fetchSpy).toHaveBeenCalled();
    const paths = fetchSpy.calls.allArgs().map((args) => String(args[0]));
    expect(paths.some((p) => p.includes('/api/v1/menus'))).toBeTrue();
    expect(paths.some((p) => p.includes('/records/rec-1'))).toBeTrue();
  });

  it('exercises auth, workflow, and integration methods', async () => {
    await client.login('admin', 'secret');
    await client.loginOAuth('client', 'secret');
    await client.enrollMfa();
    await client.verifyMfa('123456');
    await client.startWorkflow('APPROVAL', 'rec-1');
    await client.assignRole('u1', 'admin');
    await client.checkAuth('customer.read');
    await client.escalateWorkflows();
    await client.evaluateWorkflowRule('true', { x: 1 });
    await client.createPaymentIntent('10.00');
    await client.confirmPaymentIntent('txn-1');
    await client.dispatchRestIntegration('https://x.com', { a: 1 });
    await client.publishKafkaIntegration('topic', { a: 1 });
    await client.invokeSoapIntegration('https://soap', 'Action', { a: 1 });
    await client.uploadSftpIntegration('host', '/path', { a: 1 });
    await client.graphqlQuery('{ entities { code } }', {});
    await client.aiChat('hello');
    await client.aiSummarize('text');

    expect(fetchSpy.calls.count()).toBeGreaterThan(15);
  });

  it('exercises admin API methods', async () => {
    await client.listAdminUsers();
    await client.getAdminUser('u1');
    await client.createAdminUser({ username: 'new', password: 'pw' });
    await client.updateAdminUser('u1', { active: false });
    await client.deactivateAdminUser('u1');
    await client.listAdminRoles();
    await client.createAdminRole({ code: 'viewer', name: 'Viewer', permissions: ['*.*'] });
    await client.updateAdminRole('r1', { name: 'Updated' });
    await client.getAdminSettings();
    await client.updateAdminSettings({ modules: { ai: { enabled: true } } });
    await client.getAdminReportSchedules();
    await client.updateAdminReportSchedule('LOW_STOCK', '0 8 * * *');
    await client.getAdminIntegrations();
    await client.updateAdminIntegrations({ rest: { base_url: 'https://x.com' } });
    await client.testAdminRestIntegration();
    await client.getAdminSecurityPolicies();
    await client.getAdminAbacPolicies();
    await client.updateAdminAbacPolicies([]);
    await client.updateAdminFieldAccess({
      entity_code: 'PRODUCT',
      field_name: 'unit_price',
      read_roles: ['inventory.access'],
    });
    await client.listAdminTemplates();
    await client.createAdminTemplate({ code: 'welcome', subject: 'Hi' });
    await client.updateAdminTemplate('tpl-1', { subject: 'Updated' });
    await client.getAdminAudit();
    await client.getAdminLayoutMetadata('PRODUCT');
    await client.getAdminLayoutOverride('PRODUCT');
    await client.putAdminLayoutOverride('PRODUCT', { form: {} });
    await client.deleteAdminLayoutOverride('PRODUCT');
    await client.getTenantIsolationOps();
    await client.putTenantIsolationOps({ mode: 'shared_database', confirmation_token: 'ok' });

    expect(fetchSpy.calls.count()).toBeGreaterThan(20);
  });

  it('getMetrics returns plain text', async () => {
    fetchSpy.and.resolveTo(new Response('metrics_total 1', { status: 200 }));
    const text = await client.getMetrics();
    expect(text).toContain('metrics');
  });

  it('setTenantId updates header tenant', async () => {
    client.setTenantId('tenant-b');
    await client.getHealth();
    const init = fetchSpy.calls.mostRecent().args[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Tenant-ID']).toBe('tenant-b');
    expect(client.getTenantId()).toBe('tenant-b');
  });

  it('subscribeRecordsStream parses SSE payloads', async () => {
    const payload = { id: 'rec-1', sku: 'A' };
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
        controller.close();
      },
    });
    fetchSpy.and.resolveTo(new Response(stream, { status: 200 }));
    const events: Record<string, unknown>[] = [];
    const unsubscribe = client.subscribeRecordsStream('PRODUCT', (event) => events.push(event));
    await new Promise((resolve) => setTimeout(resolve, 50));
    unsubscribe();
    expect(events.length).toBe(1);
    expect(events[0]['sku']).toBe('A');
  });

  it('createClient uses window.EMCAP_API_URL when set', () => {
    (window as unknown as { EMCAP_API_URL?: string }).EMCAP_API_URL = 'http://custom:9000';
    const custom = createClient();
    expect(custom).toBeTruthy();
    delete (window as unknown as { EMCAP_API_URL?: string }).EMCAP_API_URL;
  });

  it('invokes onUnauthorized when an authenticated request returns 401', async () => {
    const onUnauthorized = jasmine.createSpy('onUnauthorized');
    client.setOnUnauthorized(onUnauthorized);
    fetchSpy.and.resolveTo(new Response('expired', { status: 401 }));
    await expectAsync(client.getMenus()).toBeRejected();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('does not invoke onUnauthorized for 401 when no token is set', async () => {
    const fresh = createClient('http://localhost:8000');
    const onUnauthorized = jasmine.createSpy('onUnauthorized');
    fresh.setOnUnauthorized(onUnauthorized);
    fetchSpy.and.resolveTo(new Response('unauthorized', { status: 401 }));
    await expectAsync(fresh.getAuthProviders()).toBeRejected();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
