import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:emcap_mobile/api/emcap_client.dart';

http.Response _json(Map<String, dynamic> body, {int status = 200}) {
  return http.Response(jsonEncode(body), status);
}

void main() {
  test('document sync and restore endpoints return typed payloads', () async {
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        final path = request.url.path;
        if (path == '/api/v1/documents' && request.method == 'GET') {
          return _json({'documents': [{'id': 'd1', 'filename': 'a.pdf'}]});
        }
        if (path.startsWith('/api/v1/documents/') && request.method == 'GET') {
          return _json({'id': 'd1', 'filename': 'a.pdf'});
        }
        if (path == '/api/v1/documents/upload' && request.method == 'POST') {
          return _json({'id': 'd2'});
        }
        if (path.startsWith('/api/v1/sync/') && path.endsWith('/snapshot')) {
          return _json({'sync_version': 'v2', 'records': []});
        }
        if (path.startsWith('/api/v1/sync/') && path.contains('/changes')) {
          return _json({'changes': [{'id': 'r1'}], 'since': '2026-01-01'});
        }
        if (path.endsWith('/restore') && request.method == 'POST') {
          return _json({'id': 'r1', 'deleted_at': null});
        }
        if (path.contains('/notes') && request.method == 'GET') {
          return _json({'notes': []});
        }
        return _json({});
      }),
    );
    client.setToken('tok', 'default');

    expect(await client.listDocuments('PRODUCT', 'r1'), hasLength(1));
    expect((await client.getDocument('d1'))['filename'], 'a.pdf');
    expect((await client.uploadDocument('PRODUCT', 'r1', 'f.txt', 'data'))['id'], 'd2');
    expect((await client.syncSnapshot('PRODUCT'))['sync_version'], 'v2');
    expect(await client.syncChanges('PRODUCT', '2026-01-01'), isNotEmpty);
    expect((await client.restoreRecord('PRODUCT', 'r1'))['deleted_at'], isNull);
  });

  test('updateAdminTemplate sends optional subject and body fields', () async {
    Map<String, dynamic>? captured;
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        if (request.method == 'PUT' && request.url.path == '/api/v1/admin/templates/t1') {
          captured = jsonDecode(request.body) as Map<String, dynamic>;
          return _json({'id': 't1'});
        }
        return _json({});
      }),
    );
    client.setToken('tok', 'default');

    await client.updateAdminTemplate(
      't1',
      channel: 'sms',
      subject: 'Alert',
      body: 'Body text',
    );

    expect(captured, {
      'channel': 'sms',
      'subject': 'Alert',
      'body': 'Body text',
    });
  });

  test('createClient factory returns configured instance', () {
    final client = createClient('http://api.test');
    expect(client.baseUrl, 'http://api.test');
  });
}
