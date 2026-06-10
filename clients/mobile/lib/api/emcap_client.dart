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
}

EmcapClient createClient([String baseUrl = 'http://localhost:8000']) {
  return EmcapClient(baseUrl);
}
