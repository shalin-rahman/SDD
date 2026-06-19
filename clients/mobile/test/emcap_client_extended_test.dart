import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:emcap_mobile/api/emcap_client.dart';

http.Response _json(Map<String, dynamic> body, {int status = 200}) {
  return http.Response(jsonEncode(body), status);
}

void main() {
  test('updateAdminUser sends optional tenant roles and password fields', () async {
    Map<String, dynamic>? capturedBody;
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        if (request.method == 'PUT' && request.url.path == '/api/v1/admin/users/u1') {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return _json({'id': 'u1'});
        }
        return _json({});
      }),
    );
    client.setToken('tok', 'default');

    await client.updateAdminUser(
      'u1',
      tenantId: 'tenant-b',
      active: false,
      roleCodes: ['admin', 'viewer'],
      password: 'secret',
    );

    expect(capturedBody, {
      'tenant_id': 'tenant-b',
      'active': false,
      'role_codes': ['admin', 'viewer'],
      'password': 'secret',
    });
  });

  test('updateAdminRole sends optional permissions', () async {
    Map<String, dynamic>? capturedBody;
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        if (request.method == 'PUT' && request.url.path == '/api/v1/admin/roles/r1') {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return _json({'id': 'r1'});
        }
        return _json({});
      }),
    );
    client.setToken('tok', 'default');

    await client.updateAdminRole('r1', permissions: ['product.read', 'product.write']);

    expect(capturedBody, {'permissions': ['product.read', 'product.write']});
  });

  test('updateAdminTemplate sends optional channel and body', () async {
    Map<String, dynamic>? capturedBody;
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        if (request.method == 'PUT' && request.url.path == '/api/v1/admin/templates/t1') {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return _json({'id': 't1'});
        }
        return _json({});
      }),
    );
    client.setToken('tok', 'default');

    await client.updateAdminTemplate('t1', channel: 'email', body: 'Hello {name}');

    expect(capturedBody, {'channel': 'email', 'body': 'Hello {name}'});
  });

  test('getMetrics throws on HTTP error status', () async {
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((_) async => http.Response('bad metrics', 503)),
    );
    client.setToken('tok', 'default');

    await expectLater(client.getMetrics(), throwsA(isA<Exception>()));
  });

  test('checkAuth forwards explicit tenant id', () async {
    Map<String, dynamic>? capturedBody;
    final client = EmcapClient(
      'http://localhost:8000',
      MockClient((request) async {
        if (request.url.path == '/api/v1/auth/check') {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return _json({'allowed': true});
        }
        return _json({});
      }),
    );
    client.setToken('tok', 'tenant-a');

    await client.checkAuth('product.read', tenantId: 'tenant-b');

    expect(capturedBody!['tenant_id'], 'tenant-b');
  });
}
