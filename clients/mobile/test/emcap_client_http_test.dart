import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:emcap_mobile/api/emcap_client.dart';

http.Response _json(Map<String, dynamic> body, {int status = 200}) {
  return http.Response(jsonEncode(body), status);
}

http.Client _mockHttpClient() {
  return MockClient((request) async {
    final path = request.url.path;
    final method = request.method;

    if (path == '/api/v1/health') return _json({'status': 'ok'});
    if (path == '/api/v1/auth/login' && method == 'POST') {
      return _json({'access_token': 'tok', 'tenant_id': 'default'});
    }
    if (path == '/api/v1/menus') return _json({'menus': []});
    if (path.startsWith('/api/v1/metadata/forms/')) return _json({'sections': []});
    if (path.startsWith('/api/v1/metadata/grids/')) return _json({'columns': []});
    if (path.contains('/records/stream')) {
      return http.Response('data: {}\n\n', 200);
    }
    if (path.contains('/notes')) {
      if (method == 'GET') return _json({'notes': []});
      return _json({'id': 'n1'});
    }
    if (path.contains('/records') && method == 'GET' && !path.contains('/notes')) {
      if (path.endsWith('/records')) return _json({'records': []});
      return _json({'id': 'r1'});
    }
    if (path.contains('/records') && method == 'POST' && path.endsWith('/restore')) {
      return _json({'id': 'r1', 'deleted_at': null});
    }
    if (path.contains('/records') && method == 'POST') return _json({'id': 'new'});
    if (path.contains('/records') && method == 'PUT') return _json({'id': 'r1'});
    if (path.contains('/records') && method == 'DELETE') return http.Response('', 204);
    if (path.startsWith('/api/v1/workflows/instances') && method == 'GET') {
      if (path == '/api/v1/workflows/instances') return _json({'instances': []});
      return _json({'id': 'wf1'});
    }
    if (path.contains('/workflows/') && path.endsWith('/start')) return _json({'id': 'wf1'});
    if (path.contains('/transition')) return _json({'current_state': 'done'});
    if (path.contains('/delegate')) return _json({'assignee': 'other'});
    if (path == '/api/v1/workflows/escalate') return _json({'escalated': 0});
    if (path == '/api/v1/workflows/rules/evaluate') return _json({'result': true});
    if (path.startsWith('/api/v1/documents')) {
      if (path.contains('/upload') && method == 'POST') return _json({'id': 'd1'});
      if (path == '/api/v1/documents' && method == 'GET') {
        return _json({'documents': []});
      }
      if (method == 'GET') {
        final id = path.split('/').last;
        return _json({'id': id});
      }
    }
    if (path.startsWith('/api/v1/sync/')) {
      if (path.contains('/snapshot')) return _json({'records': []});
      return _json({'changes': []});
    }
    if (path.startsWith('/api/v1/reports')) {
      if (path.endsWith('/run')) return _json({'run_id': 'run1'});
      if (path.contains('/runs/')) return _json({'id': 'run1'});
      if (path.endsWith('/runs')) return _json({'runs': []});
      return _json({'reports': []});
    }
    if (path == '/api/v1/notifications') return _json({'notifications': []});
    if (path == '/api/v1/notifications/send') return _json({'sent': true});
    if (path == '/api/v1/permissions') return _json({'permissions': ['read']});
    if (path == '/api/v1/auth/roles') return _json({'roles': []});
    if (path == '/api/v1/dashboards') return _json({'dashboards': []});
    if (path == '/api/v1/config/platform') return _json({'modules': {}});
    if (path == '/api/v1/tenants') return _json({'tenants': []});
    if (path == '/api/v1/payments/intents') return _json({'id': 'pi1'});
    if (path.contains('/payments/intents/') && path.endsWith('/confirm')) {
      return _json({'status': 'confirmed'});
    }
    if (path.contains('/integrations/rest/dispatch')) return _json({'ok': true});
    if (path.contains('/integrations/kafka/publish')) return _json({'ok': true});
    if (path.contains('/integrations/soap/invoke')) return _json({'ok': true});
    if (path.contains('/integrations/sftp/upload')) return _json({'ok': true});
    if (path == '/api/v1/graphql') return _json({'data': {}});
    if (path == '/api/v1/auth/me') return _json({'user_id': 'u1'});
    if (path == '/api/v1/auth/roles/assign') return _json({'ok': true});
    if (path == '/api/v1/auth/check') return _json({'allowed': true});
    if (path == '/api/v1/entities') return _json({'entities': ['PRODUCT']});
    if (path == '/api/v1/metrics') return http.Response('# metrics', 200);
    if (path == '/api/v1/auth/providers') return _json({'providers': ['username_password']});
    if (path == '/api/v1/auth/oauth/token') return _json({'access_token': 'oauth'});
    if (path == '/api/v1/auth/mfa/enroll') return _json({'secret': 's'});
    if (path == '/api/v1/auth/mfa/verify') return _json({'access_token': 'mfa'});
    if (path == '/api/v1/ai/chat') return _json({'reply': 'hi'});
    if (path == '/api/v1/ai/summarize') return _json({'summary': 's'});
    if (path == '/api/v1/admin/users') {
      if (method == 'GET') return _json({'users': []});
      return _json({'id': 'u1'});
    }
    if (path.startsWith('/api/v1/admin/users/')) {
      if (path.endsWith('/deactivate')) return _json({'active': false});
      if (method == 'GET') return _json({'id': 'u1'});
      return _json({'id': 'u1'});
    }
    if (path == '/api/v1/admin/roles') {
      if (method == 'GET') return _json({'roles': []});
      return _json({'id': 'r1'});
    }
    if (path.startsWith('/api/v1/admin/roles/')) return _json({'id': 'r1'});
    if (path == '/api/v1/admin/settings') return _json({'settings': {}});
    if (path == '/api/v1/admin/organization-profile') return _json({'profile': {}});
    if (path == '/api/v1/admin/organization-profile/logo') return _json({'logo_url': '/x'});
    if (path == '/api/v1/admin/integrations') return _json({'integrations': {}});
    if (path == '/api/v1/admin/integrations/test-rest') return _json({'ok': true});
    if (path == '/api/v1/admin/security/policies') return _json({'policies': {}});
    if (path == '/api/v1/admin/security/abac') return _json({'policies': []});
    if (path == '/api/v1/admin/security/field-access') return _json({'ok': true});
    if (path.contains('/admin/metadata/layouts/')) {
      if (path.endsWith('/override') && method == 'DELETE') return http.Response('', 204);
      if (path.endsWith('/override')) return _json({'ok': true});
      return _json({'layout': {}});
    }
    if (path == '/api/v1/admin/ops/tenant-isolation') return _json({'mode': 'shared'});
    if (path == '/api/v1/admin/templates') {
      if (method == 'GET') return _json({'templates': []});
      return _json({'id': 't1'});
    }
    if (path.startsWith('/api/v1/admin/templates/')) {
      if (method == 'DELETE') return http.Response('', 204);
      return _json({'id': 't1'});
    }
    if (path == '/api/v1/admin/audit') return _json({'audit': []});
    if (path.contains('/audit') && path.contains('/entities/')) return _json({'audit': []});

    return _json({}, status: 404);
  });
}

void main() {
  late EmcapClient client;
  var unauthorized = false;

  setUp(() {
    unauthorized = false;
    client = EmcapClient('http://localhost:8000', _mockHttpClient());
    client.setToken('test-token', 'tenant-a');
    client.setOnUnauthorized(() => unauthorized = true);
  });

  test('session helpers set token and tenant', () {
    expect(client.getTenantId(), 'tenant-a');
    client.setTenantId('tenant-b');
    expect(client.getTenantId(), 'tenant-b');
    client.clearSession();
  });

  test('MaskedSecretView parses json', () {
    final view = MaskedSecretView.fromJson({'masked': '***', 'configured': true});
    expect(view.masked, '***');
    expect(view.configured, isTrue);
    final unset = MaskedSecretView.fromJson({});
    expect(unset.masked, '');
    expect(unset.configured, isFalse);
  });

  test('login and auth endpoints', () async {
    final login = await client.login('admin', 'pass');
    expect(login['access_token'], 'tok');
    expect(await client.getAuthProviders(), isNotEmpty);
    expect((await client.loginOAuth('id', 'secret'))['access_token'], 'oauth');
    expect((await client.enrollMfa())['secret'], 's');
    expect((await client.verifyMfa('123456'))['access_token'], 'mfa');
    expect((await client.getMe())['user_id'], 'u1');
    expect(await client.checkAuth('read'), isNotEmpty);
    expect(await client.assignRole('u1', 'admin'), isNotEmpty);
  });

  test('metadata and entity CRUD endpoints', () async {
    expect(await client.getMenus(), isEmpty);
    expect(await client.getFormMetadata('PRODUCT'), isNotEmpty);
    expect(await client.getGridMetadata('PRODUCT'), isNotEmpty);
    expect(await client.listRecords('PRODUCT'), isEmpty);
    expect(await client.listRecords('PRODUCT', q: 'x'), isEmpty);
    expect((await client.createRecord('PRODUCT', {'name': 'A'}))['id'], 'new');
    expect((await client.getRecord('PRODUCT', 'r1'))['id'], 'r1');
    expect((await client.updateRecord('PRODUCT', 'r1', {'name': 'B'}, ifMatch: 1))['id'], 'r1');
    await client.deleteRecord('PRODUCT', 'r1');
    expect((await client.restoreRecord('PRODUCT', 'r1'))['id'], 'r1');
    expect(await client.listEntities(), contains('PRODUCT'));
  });

  test('notes documents sync endpoints', () async {
    expect(await client.listNotes('PRODUCT', 'r1'), isEmpty);
    expect((await client.addNote('PRODUCT', 'r1', 'hi'))['id'], 'n1');
    expect(await client.listDocuments('PRODUCT', 'r1'), isEmpty);
    expect((await client.uploadDocument('PRODUCT', 'r1', 'f.txt', 'data'))['id'], 'd1');
    expect((await client.getDocument('d1'))['id'], 'd1');
    expect(await client.syncSnapshot('PRODUCT'), isNotEmpty);
    expect(await client.syncChanges('PRODUCT', '2026-01-01'), isNotEmpty);
  });

  test('workflow endpoints', () async {
    expect(await client.listWorkflowInstances(), isEmpty);
    expect(await client.listWorkflowInstances(recordId: 'r1'), isEmpty);
    expect((await client.getWorkflowInstance('wf1'))['id'], 'wf1');
    expect((await client.startWorkflow('approval', 'r1'))['id'], 'wf1');
    expect((await client.transitionWorkflow('wf1', 'approve', 'admin'))['current_state'], 'done');
    expect((await client.delegateWorkflow('wf1', 'other'))['assignee'], 'other');
    expect(await client.escalateWorkflows(), isNotEmpty);
    expect((await client.evaluateWorkflowRule('true', {}))['result'], isTrue);
  });

  test('reports dashboards notifications endpoints', () async {
    expect(await client.listReports(), isEmpty);
    expect((await client.runReport('sales'))['run_id'], 'run1');
    expect(await client.listReportRuns('sales'), isEmpty);
    expect((await client.getReportRun('run1'))['id'], 'run1');
    expect(await client.listDashboards(), isEmpty);
    expect(await client.listNotifications(), isEmpty);
    expect(await client.sendNotification(
      channel: 'email',
      recipient: 'a@b.co',
      subject: 's',
      body: 'b',
    ), isNotEmpty);
  });

  test('platform config health tenants permissions', () async {
    expect(await client.getHealth(), isNotEmpty);
    expect(await client.getPlatformConfig(), isNotEmpty);
    expect(await client.listTenants(), isNotEmpty);
    expect(await client.getPermissions(), contains('read'));
    expect(await client.getRoles(), isEmpty);
    expect(await client.getMetrics(), contains('metrics'));
  });

  test('payments and integrations endpoints', () async {
    expect((await client.createPaymentIntent('10.00'))['id'], 'pi1');
    expect((await client.confirmPaymentIntent('pi1'))['status'], 'confirmed');
    expect(await client.dispatchRestIntegration('http://x', {}), isNotEmpty);
    expect(await client.publishKafkaIntegration('topic', {}), isNotEmpty);
    expect(await client.invokeSoapIntegration('ep', 'act', {}), isNotEmpty);
    expect(await client.uploadSftpIntegration('host', '/path', {}), isNotEmpty);
    expect(await client.graphqlQuery('{ x }'), isNotEmpty);
  });

  test('ai endpoints', () async {
    expect((await client.aiChat('hello'))['reply'], 'hi');
    expect((await client.aiSummarize('long text'))['summary'], 's');
  });

  test('admin endpoints', () async {
    expect(await client.listAdminUsers(), isEmpty);
    expect((await client.getAdminUser('u1'))['id'], 'u1');
    expect((await client.createAdminUser(username: 'u', password: 'p'))['id'], 'u1');
    expect((await client.updateAdminUser('u1', active: false))['id'], 'u1');
    expect((await client.deactivateAdminUser('u1'))['active'], isFalse);
    expect(await client.listAdminRoles(), isEmpty);
    expect((await client.createAdminRole(code: 'x', name: 'X', permissions: []))['id'], 'r1');
    expect((await client.updateAdminRole('r1', name: 'Y'))['id'], 'r1');
    expect(await client.getAdminSettings(), isNotEmpty);
    expect(await client.updateAdminSettings({}), isNotEmpty);
    expect(await client.getAdminOrganizationProfile(), isNotEmpty);
    expect(await client.updateAdminOrganizationProfile({}), isNotEmpty);
    expect(await client.uploadAdminOrganizationLogo(filename: 'l.png', contentBase64: 'abc'),
        isNotEmpty);
    expect(await client.getAdminIntegrations(), isNotEmpty);
    expect(await client.updateAdminIntegrations({}), isNotEmpty);
    expect(await client.testAdminRestIntegration(), isNotEmpty);
    expect(await client.getAdminSecurityPolicies(), isNotEmpty);
    expect(await client.getAdminAbacPolicies(), isEmpty);
    expect(await client.updateAdminAbacPolicies([]), isEmpty);
    expect(await client.updateAdminFieldAccess(
      entityCode: 'PRODUCT',
      fieldName: 'sku',
      readRoles: ['admin'],
    ), isNotEmpty);
    expect(await client.getAdminLayoutMetadata('PRODUCT'), isNotEmpty);
    expect(await client.putAdminLayoutOverride('PRODUCT', {}), isNotEmpty);
    await client.deleteAdminLayoutOverride('PRODUCT');
    expect(await client.getTenantIsolationOps(), isNotEmpty);
    expect(await client.putTenantIsolationOps(mode: 'schema', confirmationToken: 'ok'),
        isNotEmpty);
    expect(await client.listAdminTemplates(), isEmpty);
    expect((await client.createAdminTemplate(code: 't'))['id'], 't1');
    expect((await client.updateAdminTemplate('t1', subject: 's'))['id'], 't1');
    await client.deleteAdminTemplate('t1');
    expect(await client.getAdminAudit(), isEmpty);
    expect(await client.listAudit('PRODUCT'), isEmpty);
  });

  test('401 clears token and invokes unauthorized handler', () async {
    final failingClient = EmcapClient(
      'http://localhost:8000',
      MockClient((_) async => http.Response('unauthorized', 401)),
    );
    failingClient.setToken('bad', 'default');
    var called = false;
    failingClient.setOnUnauthorized(() => called = true);
    await expectLater(failingClient.getHealth(), throwsException);
    expect(called, isTrue);
  });

  test('204 responses decode to empty map', () async {
    final emptyClient = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        if (request.method == 'DELETE') {
          return http.Response('', 204);
        }
        return _json({'status': 'ok'});
      }),
    );
    await expectLater(emptyClient.deleteRecord('PRODUCT', 'r1'), completes);
  });

  test('400 errors throw without clearing session when no token', () async {
    final clientNoToken = EmcapClient(
      'http://localhost:8000',
      MockClient((_) async => http.Response('bad request', 400)),
    );
    await expectLater(clientNoToken.getHealth(), throwsA(isA<Exception>()));
  });

  test('subscribeRecordsStream invokes callback on SSE chunk', () async {
    var events = 0;
    client.subscribeRecordsStream('PRODUCT', () => events++);
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(events, greaterThan(0));
  });
}
