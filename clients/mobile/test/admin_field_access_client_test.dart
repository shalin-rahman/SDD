import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';

void main() {
  test('EmcapClient exposes updateAdminFieldAccess', () {
    final client = EmcapClient('http://localhost:8000');
    expect(client.updateAdminFieldAccess, isA<Function>());
  });
}
