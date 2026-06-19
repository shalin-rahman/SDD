import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/assistant_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/screen_test_harness.dart';

class _AssistantClient extends EmcapClient {
  _AssistantClient({this.failChat = false}) : super('http://test');

  final bool failChat;

  @override
  Future<Map<String, dynamic>> aiChat(String message) async {
    if (failChat) throw Exception('chat down');
    return {'reply': 'Inventory is healthy'};
  }

  @override
  Future<Map<String, dynamic>> aiSummarize(String text) async {
    return {'summary': 'Short summary'};
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('AssistantScreen disabled shows message', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AssistantScreen(client: _AssistantClient(), enabled: false),
      ),
    );
    expect(find.text(EmcapLocale.t('platform.assistant.disabled')), findsOneWidget);
  });

  testWidgets('AssistantScreen chat and summarize populate response', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AssistantScreen(client: _AssistantClient(), enabled: true),
      ),
    );
    await tester.tap(find.text(EmcapLocale.t('platform.assistant.chat')));
    await pumpUntilFound(tester, find.text('Inventory is healthy'));

    await tester.tap(find.text(EmcapLocale.t('platform.assistant.summarize')));
    await pumpUntilFound(tester, find.text('Short summary'));
  });

  testWidgets('AssistantScreen shows chat error', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AssistantScreen(client: _AssistantClient(failChat: true), enabled: true),
      ),
    );
    await tester.tap(find.text(EmcapLocale.t('platform.assistant.chat')));
    await pumpUntilFound(tester, find.textContaining('chat down'));
  });
}
