import 'package:emcap_mobile/api/emcap_client.dart';

/// Default fake client for shell and admin screen widget tests.
class FakeEmcapClient extends EmcapClient {
  FakeEmcapClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getHealth() async => {
        'multi_tenant': true,
        'tenant_strategy': 'schema',
      };

  @override
  Future<Map<String, dynamic>> listTenants() async => {
        'white_label': false,
        'tenants': [
          {'id': 'default', 'name': 'Default'},
        ],
      };

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {
        'modules': {
          'workflow': {'enabled': true},
          'payments': {'enabled': true},
          'notifications': {'enabled': true},
          'ai': {'enabled': true},
        },
      };

  @override
  Future<Map<String, dynamic>> getMe() async => {
        'user_id': 'admin',
        'permissions': ['*.*'],
      };

  @override
  Future<List<Map<String, dynamic>>> getMenus() async => [
        {
          'code': 'products',
          'label': 'Products',
          'entity_code': 'PRODUCT',
          'module': 'inventory',
          'icon': 'inventory_2',
        },
      ];

  @override
  Future<List<String>> getAuthProviders() async => ['username_password'];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [
        {
          'id': 'wf-1',
          'workflow_code': 'approval',
          'record_id': 'rec-1',
          'entity_code': 'PRODUCT',
          'current_state': 'submitted',
          'assignee': 'admin',
          'due_at': '2026-06-20T12:00:00Z',
        },
      ];

  @override
  Future<Map<String, dynamic>> getWorkflowInstance(String instanceId) async => {
        'id': instanceId,
        'workflow_code': 'approval',
        'current_state': 'pending',
        'history': [],
      };

  @override
  Future<Map<String, dynamic>> escalateWorkflows() async => {'escalated': 1};

  @override
  Future<Map<String, dynamic>> transitionWorkflow(
    String instanceId,
    String action,
    String actor,
  ) async =>
      {'id': instanceId, 'current_state': 'approved'};

  @override
  Future<Map<String, dynamic>> delegateWorkflow(String instanceId, String delegateTo) async =>
      {'id': instanceId, 'assignee': delegateTo};

  @override
  Future<List<Map<String, dynamic>>> listReports() async => [
        {'code': 'sales', 'name': 'Sales Report'},
      ];

  @override
  Future<Map<String, dynamic>> runReport(String reportCode) async => {
        'run_id': 'run-1',
        'rows': [
          {'amount': 100, 'region': 'NA'},
        ],
      };

  @override
  Future<List<Map<String, dynamic>>> listReportRuns(String reportCode) async => [
        {'id': 'run-0', 'status': 'completed'},
      ];

  @override
  Future<List<Map<String, dynamic>>> listDashboards() async => [
        {
          'code': 'main',
          'name': 'Main',
          'widgets': [
            {'type': 'kpi', 'label': 'Revenue'},
          ],
        },
      ];

  @override
  Future<List<Map<String, dynamic>>> listNotifications() async => [
        {'id': 'n-1', 'subject': 'Hello', 'body': 'World', 'read': false},
      ];

  @override
  Future<List<String>> getPermissions() async => ['*.*'];

  @override
  Future<List<Map<String, dynamic>>> getRoles() async => [
        {'code': 'ADMIN'},
      ];

  @override
  Future<Map<String, dynamic>> enrollMfa() async => {'secret': 'TEST-SECRET'};

  @override
  Future<Map<String, dynamic>> verifyMfa(String code) async => {'access_token': 'token-$code'};

  @override
  Future<Map<String, dynamic>> aiChat(String message) async => {'reply': 'echo: $message'};

  @override
  Future<Map<String, dynamic>> aiSummarize(String text) async => {'summary': text.substring(0, 10)};

  @override
  Future<List<Map<String, dynamic>>> listAdminUsers() async => [
        {
          'id': 'u-1',
          'username': 'admin',
          'active': true,
          'tenant_id': 'default',
          'role_codes': ['admin'],
        },
      ];

  @override
  Future<List<Map<String, dynamic>>> listAdminRoles() async => [
        {'id': 'r-1', 'code': 'admin', 'name': 'Admin', 'permissions': ['*.*']},
      ];

  @override
  Future<Map<String, dynamic>> getAdminSecurityPolicies() async => {
        'policies': {'password_min_length': 8},
      };

  @override
  Future<List<Map<String, dynamic>>> getAdminAbacPolicies() async => [
        {'id': 'p-1', 'name': 'Default', 'expression': 'true'},
      ];

  @override
  Future<Map<String, dynamic>> getAdminSettings() async => {
        'settings': {'modules': {}},
        'editable_paths': [],
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> getAdminIntegrations() async => {
        'integrations': {},
        'override_paths': [],
      };

  @override
  Future<List<Map<String, dynamic>>> listAdminTemplates() async => [];

  @override
  Future<List<Map<String, dynamic>>> getAdminAudit() async => [];

  @override
  Future<Map<String, dynamic>> getTenantIsolationOps() async => {
        'configured_mode': 'shared_database',
        'effective_mode': 'shared_database',
        'has_override': false,
        'reload_hint': '',
      };

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async => {
        'entity_code': entityCode,
        'sections': [],
        'conditions': [],
      };

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async => {
        'entity_code': entityCode,
        'columns': [],
      };

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [
        {'id': 'rec-1', 'name': 'Sample'},
      ];
}
