import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'api/emcap_client.dart';
import 'app/shell.dart';
import 'services/i18n_service.dart';
import 'services/preferences_service.dart';
import 'theme.dart';

const _apiBaseUrl = String.fromEnvironment('EMCAP_API_URL', defaultValue: 'http://localhost:8000');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await PreferencesService.create();
  await I18nService.loadBundles();
  EmcapTheme.init(preferences);
  EmcapLocale.init(preferences);
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
        return ValueListenableBuilder<ThemeMode>(
          valueListenable: EmcapTheme.themeMode,
          builder: (context, mode, _) {
            return ValueListenableBuilder<Locale>(
              valueListenable: EmcapLocale.locale,
              builder: (context, locale, _) {
                return MaterialApp(
                  title: 'EMCAP Mobile',
                  theme: ThemeData(colorSchemeSeed: seed, useMaterial3: true, brightness: Brightness.light),
                  darkTheme: ThemeData(colorSchemeSeed: seed, useMaterial3: true, brightness: Brightness.dark),
                  themeMode: mode,
                  locale: locale,
                  supportedLocales: EmcapLocale.supported,
                  localizationsDelegates: const [
                    GlobalMaterialLocalizations.delegate,
                    GlobalWidgetsLocalizations.delegate,
                    GlobalCupertinoLocalizations.delegate,
                  ],
                  home: LoginScreen(client: client),
                );
              },
            );
          },
        );
      },
    );
  }
}
