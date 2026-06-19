import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';

class _TestClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      {'id': recordId, 'sku': 'X'};
}

void main() {
  test('EmcapClient subclass override dispatches getRecord', () async {
    final EmcapClient client = _TestClient();
    final record = await client.getRecord('PRODUCT', 'prod-1');
    expect(record['sku'], 'X');
  });
}
