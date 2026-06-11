import 'dart:convert';

import 'package:http/http.dart' as http;

class EmcapClient {
  EmcapClient(this.baseUrl);

  final String baseUrl;
  String? _token;
  String _tenantId = 'default';

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
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.Request(method, uri)
      ..headers.addAll(_headers())
      ..body = body == null ? '' : jsonEncode(body);
    final streamed = await response.send();
    final text = await streamed.stream.bytesToString();
    if (streamed.statusCode >= 400) {
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

  Future<List<Map<String, dynamic>>> listRecords(String entityCode) async {
    final body = await _request('GET', '/api/v1/entities/$entityCode/records');
    return List<Map<String, dynamic>>.from(body['records'] as List);
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
    Map<String, dynamic> data,
  ) async {
    return _request(
      'PUT',
      '/api/v1/entities/$entityCode/records/$recordId',
      body: data,
    );
  }

  Future<void> deleteRecord(String entityCode, String recordId) async {
    await _request('DELETE', '/api/v1/entities/$entityCode/records/$recordId');
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

  Future<List<String>> listReports() async {
    final body = await _request('GET', '/api/v1/reports');
    return List<String>.from(body['reports'] as List);
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

  void subscribeRecordsStream(String entityCode, void Function() onEvent) {
    final uri = Uri.parse('$baseUrl/api/v1/entities/$entityCode/records/stream');
    final request = http.Request('GET', uri)..headers.addAll(_headers());
    http.Client().send(request).then((streamed) {
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
