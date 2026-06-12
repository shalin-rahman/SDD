import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('web and mobile i18n bundles share the same keys', () {
    final repoRoot = Directory.current.path.contains('clients${Platform.pathSeparator}mobile')
        ? Directory('..${Platform.pathSeparator}..')
        : Directory('.');
    final webDir = Directory('${repoRoot.path}${Platform.pathSeparator}clients${Platform.pathSeparator}web${Platform.pathSeparator}src${Platform.pathSeparator}assets${Platform.pathSeparator}i18n');
    final mobileDir = Directory('assets${Platform.pathSeparator}i18n');

    final webEn = _loadJson('${webDir.path}${Platform.pathSeparator}en.json');
    final mobileEn = _loadJson('${mobileDir.path}${Platform.pathSeparator}en.json');
    expect(mobileEn.keys.toSet(), webEn.keys.toSet());

    for (final locale in ['fr', 'bn']) {
      final web = _loadJson('${webDir.path}${Platform.pathSeparator}$locale.json');
      final mobile = _loadJson('${mobileDir.path}${Platform.pathSeparator}$locale.json');
      expect(mobile.keys.toSet(), web.keys.toSet(), reason: locale);
    }
  });
}

Map<String, dynamic> _loadJson(String path) {
  final file = File(path);
  return jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
}
