import 'dart:convert';

import 'package:http/http.dart' as http;

class MaskedSecretView {
  const MaskedSecretView({required this.masked, required this.configured});

  final String masked;
  final bool configured;

  factory MaskedSecretView.fromJson(Map<String, dynamic> json) {
    return MaskedSecretView(
      masked: '${json['masked'] ?? ''}',
      configured: json['configured'] == true,
    );
  }
}

class EmcapClient {
  EmcapClient([this.baseUrl = 'http://localhost:8000', http.Client? httpClient])
      : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;
  String? _token;
  String _tenantId = 'default';
  void Function()? _onUnauthorized;

  void setOnUnauthorized(void Function() handler) {
    _onUnauthorized = handler;
  }

  void clearSession() {
    _token = null;
  }

  void setToken(String token, String tenantId) {
    _token = token;
    _tenantId = tenantId;
  }

  Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'X-Tenant-ID': _tenantId,
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? extraHeaders,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = _headers();
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    final request = http.Request(method, uri)
      ..headers.addAll(headers)
      ..body = body == null ? '' : jsonEncode(body);
    final streamed = await _httpClient.send(request);
    final text = await streamed.stream.bytesToString();
    if (streamed.statusCode >= 400) {
      if (streamed.statusCode == 401 && _token != null) {
        _token = null;
        _onUnauthorized?.call();
      }
      throw Exception('${streamed.statusCode}: $text');
    }
    if (streamed.statusCode == 204 || text.isEmpty) {
      return {};
    }
    return jsonDecode(text) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    return _request('POST', '/api/v1/auth/login', body: {
      'username': username,
      'password': password,
    });
  }

  Future<List<Map<String, dynamic>>> getMenus() async {
    final body = await _request('GET', '/api/v1/menus');
    return List<Map<String, dynamic>>.from(body['menus'] as List);
  }

  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    return _request('GET', '/api/v1/metadata/forms/$entityCode');
  }

  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async {
    return _request('GET', '/api/v1/metadata/grids/$entityCode');
  }

  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async {
    final query = q == null || q.isEmpty ? '' : '?q=${Uri.encodeComponent(q)}';
    final body = await _request('GET', '/api/v1/entities/$entityCode/records$query');
    return List<Map<String, dynamic>>.from(body['records'] as List);
  }

  void setTenantId(String tenantId) {
    _tenantId = tenantId;
  }

  String getTenantId() => _tenantId;

  Future<List<String>> getAuthProviders() async {
    final body = await _request('GET', '/api/v1/auth/providers');
    return List<String>.from(body['providers'] as List);
  }

  Future<Map<String, dynamic>> loginOAuth(String clientId, String clientSecret) async {
    return _request('POST', '/api/v1/auth/oauth/token', body: {
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret,
    });
  }

  Future<Map<String, dynamic>> startWorkflow(
    String workflowCode,
    String recordId, {
    String assignee = 'admin',
  }) async {
    return _request('POST', '/api/v1/workflows/$workflowCode/start', body: {
      'record_id': recordId,
      'assignee': assignee,
    });
  }

  Future<List<Map<String, dynamic>>> listReportRuns(String reportCode) async {
    final body = await _request('GET', '/api/v1/reports/$reportCode/runs');
    return List<Map<String, dynamic>>.from(body['runs'] as List);
  }

  Future<Map<String, dynamic>> getReportRun(String runId) async {
    return _request('GET', '/api/v1/reports/runs/$runId');
  }

  Future<Map<String, dynamic>> getDocument(String documentId) async {
    return _request('GET', '/api/v1/documents/$documentId');
  }

  Future<Map<String, dynamic>> enrollMfa() async {
    return _request('POST', '/api/v1/auth/mfa/enroll');
  }

  Future<Map<String, dynamic>> verifyMfa(String code) async {
    return _request('POST', '/api/v1/auth/mfa/verify', body: {'code': code});
  }

  Future<Map<String, dynamic>> aiChat(String message) async {
    return _request('POST', '/api/v1/ai/chat', body: {'message': message});
  }

  Future<Map<String, dynamic>> aiSummarize(String text) async {
    return _request('POST', '/api/v1/ai/summarize', body: {'text': text});
  }

  Future<Map<String, dynamic>> createRecord(
    String entityCode,
    Map<String, dynamic> data,
  ) async {
    return _request('POST', '/api/v1/entities/$entityCode/records', body: data);
  }

  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async {
    return _request('GET', '/api/v1/entities/$entityCode/records/$recordId');
  }

  Future<Map<String, dynamic>> updateRecord(
    String entityCode,
    String recordId,
    Map<String, dynamic> data, {
    int? ifMatch,
  }) async {
    return _request(
      'PUT',
      '/api/v1/entities/$entityCode/records/$recordId',
      body: data,
      extraHeaders: ifMatch != null ? {'If-Match': '$ifMatch'} : null,
    );
  }

  Future<Map<String, dynamic>> deleteRecord(String entityCode, String recordId) async {
    return _request('DELETE', '/api/v1/entities/$entityCode/records/$recordId');
  }

  Future<Map<String, dynamic>> restoreRecord(String entityCode, String recordId) async {
    return _request('POST', '/api/v1/entities/$entityCode/records/$recordId/restore');
  }

  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async {
    return _request('GET', '/api/v1/sync/$entityCode/snapshot');
  }

  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async {
    final body = await _request('GET', '/api/v1/entities/$entityCode/records/$recordId/notes');
    return List<Map<String, dynamic>>.from(body['notes'] as List);
  }

  Future<Map<String, dynamic>> addNote(
    String entityCode,
    String recordId,
    String body,
  ) async {
    return _request(
      'POST',
      '/api/v1/entities/$entityCode/records/$recordId/notes',
      body: {'body': body},
    );
  }

  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async {
    final query = recordId == null ? '' : '?record_id=${Uri.encodeComponent(recordId)}';
    final body = await _request('GET', '/api/v1/workflows/instances$query');
    return List<Map<String, dynamic>>.from(body['instances'] as List);
  }

  Future<Map<String, dynamic>> getWorkflowInstance(String instanceId) async {
    return _request('GET', '/api/v1/workflows/instances/$instanceId');
  }

  Future<Map<String, dynamic>> escalateWorkflows() async {
    return _request('POST', '/api/v1/workflows/escalate');
  }

  Future<Map<String, dynamic>> evaluateWorkflowRule(
    String expression,
    Map<String, dynamic> context,
  ) async {
    return _request('POST', '/api/v1/workflows/rules/evaluate', body: {
      'expression': expression,
      'context': context,
    });
  }

  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async {
    final query = Uri(queryParameters: {
      'entity_code': entityCode,
      'record_id': recordId,
    }).query;
    final body = await _request('GET', '/api/v1/documents?$query');
    return List<Map<String, dynamic>>.from(body['documents'] as List);
  }

  Future<Map<String, dynamic>> syncChanges(String entityCode, String since) async {
    final query = Uri(queryParameters: {'since': since}).query;
    return _request('GET', '/api/v1/sync/$entityCode/changes?$query');
  }

  Future<List<Map<String, dynamic>>> listReports() async {
    final body = await _request('GET', '/api/v1/reports');
    return List<Map<String, dynamic>>.from(body['reports'] as List);
  }

  Future<Map<String, dynamic>> runReport(String reportCode) async {
    return _request('POST', '/api/v1/reports/$reportCode/run');
  }

  Future<Map<String, dynamic>> transitionWorkflow(
    String instanceId,
    String action,
    String actor,
  ) async {
    return _request(
      'POST',
      '/api/v1/workflows/instances/$instanceId/transition',
      body: {'action': action, 'actor': actor},
    );
  }

  Future<Map<String, dynamic>> delegateWorkflow(String instanceId, String delegateTo) async {
    return _request(
      'POST',
      '/api/v1/workflows/instances/$instanceId/delegate',
      body: {'delegate_to': delegateTo},
    );
  }

  Future<Map<String, dynamic>> uploadDocument(
    String entityCode,
    String recordId,
    String filename,
    String content,
  ) async {
    return _request('POST', '/api/v1/documents/upload', body: {
      'entity_code': entityCode,
      'record_id': recordId,
      'filename': filename,
      'content': content,
    });
  }

  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async {
    final body = await _request('GET', '/api/v1/entities/$entityCode/audit');
    return List<Map<String, dynamic>>.from(body['audit'] as List);
  }

  Future<List<Map<String, dynamic>>> listNotifications() async {
    final body = await _request('GET', '/api/v1/notifications');
    return List<Map<String, dynamic>>.from(body['notifications'] as List);
  }

  Future<Map<String, dynamic>> sendNotification({
    required String channel,
    required String recipient,
    required String subject,
    required String body,
  }) async {
    return _request('POST', '/api/v1/notifications/send', body: {
      'channel': channel,
      'recipient': recipient,
      'subject': subject,
      'body': body,
    });
  }

  Future<List<String>> getPermissions() async {
    final body = await _request('GET', '/api/v1/permissions');
    return List<String>.from(body['permissions'] as List);
  }

  Future<List<Map<String, dynamic>>> getRoles() async {
    final body = await _request('GET', '/api/v1/auth/roles');
    return List<Map<String, dynamic>>.from(body['roles'] as List);
  }

  Future<List<Map<String, dynamic>>> listDashboards() async {
    final body = await _request('GET', '/api/v1/dashboards');
    return List<Map<String, dynamic>>.from(body['dashboards'] as List);
  }

  Future<Map<String, dynamic>> getHealth() async {
    return _request('GET', '/api/v1/health');
  }

  Future<Map<String, dynamic>> getPlatformConfig() async {
    return _request('GET', '/api/v1/config/platform');
  }

  Future<Map<String, dynamic>> listTenants() async {
    return _request('GET', '/api/v1/tenants');
  }

  Future<Map<String, dynamic>> createPaymentIntent(String amount, {String currency = 'USD'}) async {
    return _request('POST', '/api/v1/payments/intents', body: {
      'amount': amount,
      'currency': currency,
    });
  }

  Future<Map<String, dynamic>> dispatchRestIntegration(
    String url,
    Map<String, dynamic> payload,
  ) async {
    return _request('POST', '/api/v1/integrations/rest/dispatch', body: {
      'url': url,
      'payload': payload,
    });
  }

  Future<Map<String, dynamic>> publishKafkaIntegration(
    String topic,
    Map<String, dynamic> payload,
  ) async {
    return _request('POST', '/api/v1/integrations/kafka/publish', body: {
      'topic': topic,
      'payload': payload,
    });
  }

  Future<Map<String, dynamic>> invokeSoapIntegration(
    String endpoint,
    String action,
    Map<String, dynamic> payload,
  ) async {
    return _request('POST', '/api/v1/integrations/soap/invoke', body: {
      'endpoint': endpoint,
      'action': action,
      'payload': payload,
    });
  }

  Future<Map<String, dynamic>> uploadSftpIntegration(
    String host,
    String path,
    Map<String, dynamic> payload,
  ) async {
    return _request('POST', '/api/v1/integrations/sftp/upload', body: {
      'host': host,
      'path': path,
      'payload': payload,
    });
  }

  Future<Map<String, dynamic>> graphqlQuery(
    String query, {
    Map<String, dynamic> variables = const {},
  }) async {
    return _request('POST', '/api/v1/graphql', body: {
      'query': query,
      'variables': variables,
    });
  }

  Future<Map<String, dynamic>> getMe() async {
    return _request('GET', '/api/v1/auth/me');
  }

  Future<Map<String, dynamic>> assignRole(String userId, String roleCode) async {
    return _request('POST', '/api/v1/auth/roles/assign', body: {
      'user_id': userId,
      'role_code': roleCode,
    });
  }

  Future<Map<String, dynamic>> checkAuth(String permission, {String? tenantId}) async {
    return _request('POST', '/api/v1/auth/check', body: {
      'permission': permission,
      'tenant_id': tenantId ?? _tenantId,
    });
  }

  Future<List<String>> listEntities() async {
    final body = await _request('GET', '/api/v1/entities');
    return List<String>.from(body['entities'] as List);
  }

  Future<String> getMetrics() async {
    final uri = Uri.parse('$baseUrl/api/v1/metrics');
    final response = await _httpClient.get(uri, headers: _headers());
    if (response.statusCode >= 400) {
      throw Exception('${response.statusCode}: ${response.body}');
    }
    return response.body;
  }

  Future<Map<String, dynamic>> confirmPaymentIntent(String transactionId) async {
    return _request('POST', '/api/v1/payments/intents/$transactionId/confirm');
  }

  Future<List<Map<String, dynamic>>> listAdminUsers() async {
    final body = await _request('GET', '/api/v1/admin/users');
    return List<Map<String, dynamic>>.from(body['users'] as List);
  }

  Future<Map<String, dynamic>> getAdminUser(String userId) async {
    return _request('GET', '/api/v1/admin/users/$userId');
  }

  Future<Map<String, dynamic>> createAdminUser({
    required String username,
    required String password,
    String tenantId = 'default',
    List<String> roleCodes = const ['viewer'],
  }) async {
    return _request('POST', '/api/v1/admin/users', body: {
      'username': username,
      'password': password,
      'tenant_id': tenantId,
      'role_codes': roleCodes,
    });
  }

  Future<Map<String, dynamic>> updateAdminUser(
    String userId, {
    String? tenantId,
    bool? active,
    List<String>? roleCodes,
    String? password,
  }) async {
    return _request('PUT', '/api/v1/admin/users/$userId', body: {
      if (tenantId != null) 'tenant_id': tenantId,
      if (active != null) 'active': active,
      if (roleCodes != null) 'role_codes': roleCodes,
      if (password != null && password.isNotEmpty) 'password': password,
    });
  }

  Future<Map<String, dynamic>> deactivateAdminUser(String userId) async {
    return _request('PATCH', '/api/v1/admin/users/$userId/deactivate');
  }

  Future<List<Map<String, dynamic>>> listAdminRoles() async {
    final body = await _request('GET', '/api/v1/admin/roles');
    return List<Map<String, dynamic>>.from(body['roles'] as List);
  }

  Future<Map<String, dynamic>> createAdminRole({
    required String code,
    required String name,
    required List<String> permissions,
  }) async {
    return _request('POST', '/api/v1/admin/roles', body: {
      'code': code,
      'name': name,
      'permissions': permissions,
    });
  }

  Future<Map<String, dynamic>> updateAdminRole(
    String roleId, {
    String? name,
    List<String>? permissions,
  }) async {
    return _request('PUT', '/api/v1/admin/roles/$roleId', body: {
      if (name != null) 'name': name,
      if (permissions != null) 'permissions': permissions,
    });
  }

  Future<Map<String, dynamic>> getAdminSettings() async {
    return _request('GET', '/api/v1/admin/settings');
  }

  Future<Map<String, dynamic>> updateAdminSettings(Map<String, dynamic> settings) async {
    return _request('PUT', '/api/v1/admin/settings', body: {'settings': settings});
  }

  Future<Map<String, dynamic>> getAdminOrganizationProfile() async {
    return _request('GET', '/api/v1/admin/organization-profile');
  }

  Future<Map<String, dynamic>> updateAdminOrganizationProfile(
    Map<String, dynamic> profile,
  ) async {
    return _request('PUT', '/api/v1/admin/organization-profile', body: {'profile': profile});
  }

  Future<Map<String, dynamic>> uploadAdminOrganizationLogo({
    required String filename,
    required String contentBase64,
  }) async {
    return _request(
      'POST',
      '/api/v1/admin/organization-profile/logo',
      body: {'filename': filename, 'content_base64': contentBase64},
    );
  }

  Future<Map<String, dynamic>> getAdminIntegrations() async {
    return _request('GET', '/api/v1/admin/integrations');
  }

  Future<Map<String, dynamic>> updateAdminIntegrations(
    Map<String, dynamic> integrations,
  ) async {
    return _request('PUT', '/api/v1/admin/integrations', body: {'integrations': integrations});
  }

  Future<Map<String, dynamic>> testAdminRestIntegration() async {
    return _request('POST', '/api/v1/admin/integrations/test-rest');
  }

  Future<Map<String, dynamic>> getAdminSecurityPolicies() async {
    return _request('GET', '/api/v1/admin/security/policies');
  }

  Future<List<Map<String, dynamic>>> getAdminAbacPolicies() async {
    final body = await _request('GET', '/api/v1/admin/security/abac');
    return List<Map<String, dynamic>>.from(body['policies'] as List);
  }

  Future<List<Map<String, dynamic>>> updateAdminAbacPolicies(
    List<Map<String, dynamic>> policies,
  ) async {
    final body = await _request('PUT', '/api/v1/admin/security/abac', body: {'policies': policies});
    return List<Map<String, dynamic>>.from(body['policies'] as List);
  }

  Future<Map<String, dynamic>> updateAdminFieldAccess({
    required String entityCode,
    required String fieldName,
    required List<String> readRoles,
  }) async {
    return _request('PUT', '/api/v1/admin/security/field-access', body: {
      'entity_code': entityCode,
      'field_name': fieldName,
      'read_roles': readRoles,
    });
  }

  Future<Map<String, dynamic>> getAdminLayoutMetadata(String entityCode) async {
    return _request('GET', '/api/v1/admin/metadata/layouts/$entityCode');
  }

  Future<Map<String, dynamic>> putAdminLayoutOverride(
    String entityCode,
    Map<String, dynamic> payload,
  ) async {
    return _request('PUT', '/api/v1/admin/metadata/layouts/$entityCode/override', body: payload);
  }

  Future<Map<String, dynamic>> deleteAdminLayoutOverride(String entityCode) async {
    return _request('DELETE', '/api/v1/admin/metadata/layouts/$entityCode/override');
  }

  Future<Map<String, dynamic>> getTenantIsolationOps() async {
    return _request('GET', '/api/v1/admin/ops/tenant-isolation');
  }

  Future<Map<String, dynamic>> putTenantIsolationOps({
    required String mode,
    required String confirmationToken,
  }) async {
    return _request('PUT', '/api/v1/admin/ops/tenant-isolation', body: {
      'mode': mode,
      'confirmation_token': confirmationToken,
    });
  }

  Future<List<Map<String, dynamic>>> listAdminTemplates() async {
    final body = await _request('GET', '/api/v1/admin/templates');
    return List<Map<String, dynamic>>.from(body['templates'] as List);
  }

  Future<Map<String, dynamic>> createAdminTemplate({
    required String code,
    String channel = 'email',
    String subject = '',
    String body = '',
  }) async {
    return _request('POST', '/api/v1/admin/templates', body: {
      'code': code,
      'channel': channel,
      'subject': subject,
      'body': body,
    });
  }

  Future<Map<String, dynamic>> updateAdminTemplate(
    String templateId, {
    String? channel,
    String? subject,
    String? body,
  }) async {
    return _request('PUT', '/api/v1/admin/templates/$templateId', body: {
      if (channel != null) 'channel': channel,
      if (subject != null) 'subject': subject,
      if (body != null) 'body': body,
    });
  }

  Future<void> deleteAdminTemplate(String templateId) async {
    await _request('DELETE', '/api/v1/admin/templates/$templateId');
  }

  Future<List<Map<String, dynamic>>> getAdminAudit() async {
    final body = await _request('GET', '/api/v1/admin/audit');
    return List<Map<String, dynamic>>.from(body['audit'] as List);
  }

  void subscribeRecordsStream(String entityCode, void Function() onEvent) {
    final uri = Uri.parse('$baseUrl/api/v1/entities/$entityCode/records/stream');
    final request = http.Request('GET', uri)..headers.addAll(_headers());
    _httpClient.send(request).then((streamed) {
      streamed.stream.transform(utf8.decoder).listen((chunk) {
        if (chunk.contains('data:')) {
          onEvent();
        }
      });
    });
  }
}

EmcapClient createClient([String baseUrl = 'http://localhost:8000']) {
  return EmcapClient(baseUrl);
}
