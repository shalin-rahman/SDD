import 'package:flutter/material.dart';

import 'api/emcap_client.dart';
import 'app/shell.dart';
import 'theme.dart';

const _apiBaseUrl = String.fromEnvironment('EMCAP_API_URL', defaultValue: 'http://localhost:8000');

void main() {
  runApp(EmcapApp(client: EmcapClient(_apiBaseUrl)));
}

class EmcapApp extends StatelessWidget {
  const EmcapApp({super.key, required this.client});

  final EmcapClient client;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Color>(
      valueListenable: EmcapTheme.seedColor,
      builder: (context, seed, _) {
        return MaterialApp(
          title: 'EMCAP Mobile',
          theme: ThemeData(colorSchemeSeed: seed, useMaterial3: true),
          home: LoginScreen(client: client),
        );
      },
    );
  }
}
